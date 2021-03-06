import { EspalierConfig } from "./espalier-config";
import { bindable, bindingMode, TaskQueue, customElement, ViewCompiler, ViewResources } from "aurelia-framework";
import { inject } from "aurelia-dependency-injection";
import { IColumnDefinition } from "./column-definition";
import { IEspalierSettings } from "./espalier-settings";
import { PageInfo } from "./page-info";
import { SortOrder, ColumnType } from "./enums";
import { ITableButton } from "./table-button";
export { PageInfo } from "./page-info";
import { ToArray } from "./helpers";
import { CurrencyFormatter, DateFormatter, IntegerFormatter, NumberFormatter, TextFormatter } from "./formatters/formatters";
import { IFilterToken } from "./espalier-filter";
import tippy from "tippy.js";

const buttonStyleElementName = "espalier-button-styles";

/**
 * Espalier is a custom element build for the Aurelia framework that
 * makes it simple to work with server-side page-able, sort-able
 * datasets.
 */
@customElement("esp-grid")
@inject(TaskQueue, EspalierConfig, ViewCompiler, ViewResources)
export class EspalierGrid<TRow> {
  /**
   * The current page of records Espalier is displaying.
   */
  public records: TRow[];

  /**
   * The current page the grid is on.
   */
  public page = 1;

  /**
   * The number of records to fetch per page.
   */
  @bindable({ defaultBindingMode: bindingMode.oneTime })
  public pageSize: number;

  /**
   * The default filter if one is not otherwise specified.
   */
  @bindable({ defaultBindingMode: bindingMode.oneTime })
  public defaultFilter: (applyTo: TRow[]) => Promise<TRow[]> | string[] | undefined;

  /**
   * The settings for this Espalier instance.
   */
  @bindable()
  public settings: IEspalierSettings<TRow>;

  protected recordCount: number;
  protected filter: (applyTo: TRow[]) => Promise<TRow[]> | string[] | undefined;
  protected loading = true;
  protected pages: PageInfo[] = [];
  protected recordsFrom: number;
  protected recordsTo: number;
  protected sortColumn: IColumnDefinition<TRow>;
  protected tableContainer: HTMLDivElement;
  protected tableHeader: HTMLTableHeaderCellElement;
  protected filterShowing = false;
  protected tableBody: HTMLElement;
  protected appliedFilters: IFilterToken[] = [];

  /**
   * Create a new instance of Espalier.
   * @param taskQueue The Aurelia TaskQueue.
   * @param config Global configuration for Espalier.
   * @param viewCompiler ViewCompiler for compiling template strings for column types.
   * @param viewResources ViewResources used by the ViewCompiler when compiling a view.
   */
  constructor(private taskQueue: TaskQueue, private config: EspalierConfig,
    private viewCompiler: ViewCompiler, private viewResources: ViewResources) { }

  /**
   * The Aurelia attached lifecycle event.
   */
  public attached() {
    if (!document.querySelectorAll(`#${buttonStyleElementName}`).length) {
      this.addButtonStyles();
    }
  }

  /**
   * Fetches records that match the filter, goes to the first page, and loads the first page into the grid.
   * @param filter A build-out query string to be appenended to any sorting and paging query parameters.
   */
  public applyFilter(filter: (applyTo: TRow[]) => Promise<TRow[]> | string[] | undefined, appliedFilters: IFilterToken[]): Promise<any> {
    this.filter = filter;
    this.appliedFilters = appliedFilters ? appliedFilters : [];
    this.page = 1;
    return this.fetch();
  }

  /**
   * Reset the filter back to the default specified for this Espalier
   * instance.
   */
  public clearFilter(): Promise<any> {
    if (!this.settings.filter) {
      this.filter = this.defaultFilter;
      return this.fetch();
    }

    return this.settings.filter.reset();
  }

  /**
   * Fetch the current page and load it into the grid.
   */
  public reload(): Promise<any> {
    return this.fetch();
  }

  /**
   * Fetches records on the given page number and loads them into the grid.
   * @param pageNumber The page number to fetch.
   */
  public goto(pageNumber: number): Promise<any> {
    this.page = pageNumber;
    return this.fetch();
  }

  /**
   * Sort by a given column. It toggles through Ascending > Descending > Not sorted on
   * @param column The column to sort on.
   */
  protected sortBy(column: IColumnDefinition<TRow>): Promise<any> {
    const sortProperty = this.getSortPropertyName(column);

    if (!sortProperty) {
      return Promise.resolve();
    }

    this.loading = true;

    if (this.sortColumn === column) {
      switch (this.sortColumn.sortOrder) {
        case SortOrder.Ascending:
          this.sortColumn.sortOrder = SortOrder.Descending;
          break;
        case SortOrder.Descending:
          this.sortColumn.sortOrder = SortOrder.NotSpecified;
          break;
        default:
          this.sortColumn.sortOrder = SortOrder.Ascending;
          break;
      }
    } else {
      if (this.sortColumn) {
        this.sortColumn.sortOrder = SortOrder.NotSpecified;
      }

      this.sortColumn = column;
      this.sortColumn.sortOrder = SortOrder.Ascending;
    }

    this.page = 1;
    return this.fetch();
  }

  /**
   * Used to figure out which buttons to show.
   * @param record Calculate which buttons should be available for the given record.
   */
  protected getButtons(record: TRow): ITableButton<TRow>[] {
    return this.settings.getButtons ? this.settings.getButtons(record) : [];
  }

  /**
   * Handles the button click event of a table button in a row.
   * @param button The TableButton that was clicked.
   * @param record The record associated with the row the button is in.
   */
  protected buttonClicked(button: ITableButton<TRow>, record: TRow) {
    button.onClick(record);
  }

  /**
   * Open the filter if this instance has one.
   */
  protected openFilter() {
    if (!this.settings || !this.settings.filter) {
      return;
    }

    this.tableContainer.appendChild(this.settings.filter.container);
    this.settings.filter.container.style.top = `${this.tableHeader.clientHeight}px`;
    this.filterShowing = true;
  }

  /**
   * Close the filter if it's open.
   */
  protected closeFilter() {
    if (!this.settings || !this.settings.filter) {
      return;
    }

    this.tableContainer.removeChild(this.settings.filter.container);
    this.filterShowing = false;
  }

  /**
   * Aurelia calls this when the settings are changed. Espalier figures out
   * if the settings are valid, then queues a task to load the grid.
   */
  protected settingsChanged() {
    if (!this.settings) {
      return;
    }

    if (this.settings.filter &&
      this.settings.filter.container &&
      this.settings.filter.container.parentElement) {
      this.settings.filter.container.parentElement.removeChild(this.settings.filter.container);
      this.settings.filter.container.classList.add("espalier-filter");
    }

    for (const column of this.settings.columns) {
      if (column.sortOrder) {
        this.sortColumn = column;
      }
    }

    if (!this.sortColumn) {
      this.sortColumn = this.settings.columns[0];
    }

    if (this.settings.filter) {
      this.settings.filter["espalier"] = this;
    }

    this.pageSize = this.pageSize ? this.pageSize : this.config.defaultPageSize;

    for (const column of this.settings.columns) {
      if (!column.templateName) {
        switch (column.type) {
          case ColumnType.Date:
            column.templateName = "date";
            break;
          case ColumnType.DateTime:
            column.templateName = "date-time";
            break;
          case ColumnType.Time:
            column.templateName = "time";
            break;
          default:
            column.templateName = "default";
            break;
        }
      }

      if (!this.config.getView(column.templateName)) {
        const templateString = this.config.cellViews.get(column.templateName);

        if (!templateString) {
          throw new Error(`Espalier was unable to find a template named "${column.templateName}"... perhaps you need to register it using EspalierConfig?`);
        }

        const factory = this.viewCompiler.compile(<string>templateString, this.viewResources);
        this.config.setView(column.templateName, factory);
      }

      if (!column.dataFormatter) {
        switch (column.type) {
          case ColumnType.Date:
          case ColumnType.DateTime:
          case ColumnType.Time:
            column.dataFormatter = new DateFormatter();
            break;
          case ColumnType.Currency:
            column.dataFormatter = new CurrencyFormatter();
            break;
          case ColumnType.Number:
            column.dataFormatter = new NumberFormatter();
            break;
          case ColumnType.Integer:
            column.dataFormatter = new IntegerFormatter();
            break;
          default:
            column.dataFormatter = new TextFormatter();
            break;
        }
      }

      column.view = this.config.getView(column.templateName);
    }

    this.taskQueue.queueMicroTask(() => {
      if (this.settings.filter) {
        return this.settings.filter.applyFilter();
      }

      return this.fetch();
    });
  }

  /**
   * Figure out out the sort property name of a given column.
   * @param column The column to figure out the sort property name of.
   */
  protected getSortPropertyName(column: IColumnDefinition<TRow>): string {
    if (!column || column.disableSort) {
      return "";
    }

    return column.sortPropertyName ? column.sortPropertyName : column.propertyName;
  }

  /**
   * Add url encoded SVG image styles for sort, filter, and close icons. Espalier
   * does it this way so the button color is customizable by the consumer.
   */
  private addButtonStyles() {
    const encodedColor = encodeURIComponent(this.config.buttonColor);
    const red = encodeURIComponent("rgb(217,83,79)");
    const white = encodeURIComponent("rgb(255,255,255)");
    const filter = `%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2222%22%20height%3D%2228%22%20viewBox%3D%220%200%2022%2028%22%3E%0A%3Ctitle%3Efilter%3C%2Ftitle%3E%0A%3Cpath%20stroke%3D%22${encodedColor}%22%20fill%3D%22${encodedColor}%22%20d%3D%22M21.922%204.609c0.156%200.375%200.078%200.812-0.219%201.094l-7.703%207.703v11.594c0%200.406-0.25%200.766-0.609%200.922-0.125%200.047-0.266%200.078-0.391%200.078-0.266%200-0.516-0.094-0.703-0.297l-4-4c-0.187-0.187-0.297-0.438-0.297-0.703v-7.594l-7.703-7.703c-0.297-0.281-0.375-0.719-0.219-1.094%200.156-0.359%200.516-0.609%200.922-0.609h20c0.406%200%200.766%200.25%200.922%200.609z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E`;
    const close = `%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%0A%3Ctitle%3Ex%3C%2Ftitle%3E%0A%3Cpath%20stroke%3D%22${red}%22%20fill%3D%22${red}%22%20d%3D%22M30%2024.398l-8.406-8.398%208.406-8.398-5.602-5.602-8.398%208.402-8.402-8.402-5.598%205.602%208.398%208.398-8.398%208.398%205.598%205.602%208.402-8.402%208.398%208.402z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E`;
    const rightCaret = `%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%229%22%20height%3D%2228%22%20viewBox%3D%220%200%209%2028%22%3E%0A%3Ctitle%3Ecaret-right%3C%2Ftitle%3E%0A%3Cpath%20stroke%3D%22${encodedColor}%22%20fill%3D%22${encodedColor}%22%20d%3D%22M9%2014c0%200.266-0.109%200.516-0.297%200.703l-7%207c-0.187%200.187-0.438%200.297-0.703%200.297-0.547%200-1-0.453-1-1v-14c0-0.547%200.453-1%201-1%200.266%200%200.516%200.109%200.703%200.297l7%207c0.187%200.187%200.297%200.438%200.297%200.703z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E`;
    const upCaret = `%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2228%22%20viewBox%3D%220%200%2016%2028%22%3E%0A%3Ctitle%3Ecaret-up%3C%2Ftitle%3E%0A%3Cpath%20stroke%3D%22${encodedColor}%22%20fill%3D%22${encodedColor}%22%20d%3D%22M16%2019c0%200.547-0.453%201-1%201h-14c-0.547%200-1-0.453-1-1%200-0.266%200.109-0.516%200.297-0.703l7-7c0.187-0.187%200.438-0.297%200.703-0.297s0.516%200.109%200.703%200.297l7%207c0.187%200.187%200.297%200.438%200.297%200.703z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E`;
    const downCaret = `%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2228%22%20viewBox%3D%220%200%2016%2028%22%3E%0A%3Ctitle%3Ecaret-down%3C%2Ftitle%3E%0A%3Cpath%20stroke%3D%22${encodedColor}%22%20fill%3D%22${encodedColor}%22%20d%3D%22M16%2011c0%200.266-0.109%200.516-0.297%200.703l-7%207c-0.187%200.187-0.438%200.297-0.703%200.297s-0.516-0.109-0.703-0.297l-7-7c-0.187-0.187-0.297-0.438-0.297-0.703%200-0.547%200.453-1%201-1h14c0.547%200%201%200.453%201%201z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E`;
    const expandCaret = `%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2228%22%20viewBox%3D%220%200%2016%2028%22%3E%0A%3Ctitle%3Ecaret-down%3C%2Ftitle%3E%0A%3Cpath%20stroke%3D%22${white}%22%20fill%3D%22${white}%22%20d%3D%22M16%2011c0%200.266-0.109%200.516-0.297%200.703l-7%207c-0.187%200.187-0.438%200.297-0.703%200.297s-0.516-0.109-0.703-0.297l-7-7c-0.187-0.187-0.297-0.438-0.297-0.703%200-0.547%200.453-1%201-1h14c0.547%200%201%200.453%201%201z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E`;
    const closeButton = `%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%0A%3Ctitle%3Ex%3C%2Ftitle%3E%0A%3Cpath%20stroke%3D%22${white}%22%20fill%3D%22${white}%22%20d%3D%22M30%2024.398l-8.406-8.398%208.406-8.398-5.602-5.602-8.398%208.402-8.402-8.402-5.598%205.602%208.398%208.398-8.398%208.398%205.598%205.602%208.402-8.402%208.398%208.402z%22%3E%3C%2Fpath%3E%0A%3C%2Fsvg%3E`;
    const css = document.createElement("style");
    css.type = "text/css";
    css.id = buttonStyleElementName;
    css.innerHTML = `
      div.espalier-table button.expand-caret {
        background-image: url('data:image/svg+xml,${expandCaret}');
      }

      div.espalier-table a.close-button, div.espalier-table button.close-button {
        background-image: url('data:image/svg+xml,${closeButton}');
      }

      th.sortable > div > span::after {
        background-image: url('data:image/svg+xml,${rightCaret}');
      }

      thead th.filter-button a i::after {
        background-image: url('data:image/svg+xml,${filter}');
      }

      thead th.close-filter-button a i::after {
        background-image: url('data:image/svg+xml,${close}');
      }

      th.sortable.sort-asc > div > span::after {
        background-image: url('data:image/svg+xml,${upCaret}');
      }

      th.sortable.sort-desc > div > span::after {
        background-image: url('data:image/svg+xml,${downCaret}');
      }
    `;

    document.querySelectorAll("head")[0].appendChild(css);
  }

  /**
   * Fetch a page of records from the server.
   */
  private async fetch(): Promise<any> {
    this.loading = true;
    const page = await this.settings.dataSource.GetPage(this.page, this.pageSize,
      this.getSortPropertyName(this.sortColumn),
      this.sortColumn ? this.sortColumn.sortOrder : SortOrder.NotSpecified, this.filter);
    this.recordCount = page.totalRecords;
    this.records = this.settings.postFetch ? this.settings.postFetch(page.records) : page.records;
    this.recordsFrom = (this.page - 1) * this.pageSize + 1;
    this.recordsTo = Math.min(this.recordCount, this.page * this.pageSize);
    const startAtPage = Math.max(1, this.page - 3);
    const endAtPage = Math.min(page.pageCount, this.page + 3 + Math.max(3 - this.page, 1));
    const nextPage = (this.page + 1);
    const pages: PageInfo[] = [];

    if (this.page > 2) {
      pages.push(new PageInfo(false, false, "&laquo;", 1));
    }

    if (this.page > 1) {
      pages.push(new PageInfo(false, false, "&lsaquo;", this.page - 1));
    }

    for (let i = startAtPage; i <= endAtPage; i++) {
      pages.push(new PageInfo(false, i === this.page, i.toString(), i));
    }

    if ((page.pageCount + 1) > nextPage) {
      pages.push(new PageInfo(false, false, "&rsaquo;", nextPage));
    }

    if ((page.pageCount - 1) > this.page) {
      pages.push(new PageInfo(false, false, "&raquo;", page.pageCount));
    }

    this.pages = pages;

    if (this.filterShowing) {
      this.closeFilter();
    }

    this.taskQueue.queueMicroTask(() => {
      const columnHeads = ToArray(this.tableHeader.querySelectorAll("th"));

      for (const columnHead of columnHeads) {
        if (!columnHead.title) {
          continue;
        }

        tippy(columnHead, {
          placement: "bottom",
          arrow: true,
          size: "large",
          followCursor: true,
          content: columnHead.title
        });
      }
    });

    this.loading = false;
  }
}
