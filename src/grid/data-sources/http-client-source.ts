import { HttpClient } from "aurelia-http-client";
import { IGridDataSource } from "./grid-data-source";
import { IEspalierPage } from "../espalier-page";
import { SortOrder } from "../enums";

export class HttpClientSource<TData> implements IGridDataSource<TData> {
  /**
   * The name of the query string parameter for the 1-based
   * page number to return.
   */
  public pageParameterName = "Page";

  /**
   * The name of the query string parameter that specifies
   * the number of records to return.
   */
  public pageSizeParameterName = "PageSize";

  /**
   * The name of the query string parameter that specifies
   * the name of the  column to sort on.
   */
  public sortOnParameterName = "SortOn";

  /**
   * The name of the query string parameter that specified
   * the order to sort in, either ascending or descending.
   */
  public sortOrderParameterName = "SortOrder";

  /**
   * The constant value indicating a descending sort order.
   */
  public descConst = "desc";

  /**
   * The constant value indicating an ascending sort order.
   */
  public ascConst = "asc";

  constructor(private url: string, private http: HttpClient) { }

  public async GetPage(pageNumber: number, pageSize: number, sortColumn: string,
    sortOrder: SortOrder | undefined, filter: (applyTo: TData[]) => Promise<TData[]> | string[] | undefined
  ): Promise<IEspalierPage<TData>> {
    const queryExpressions = this.buildPagingQueryString(
      pageNumber, pageSize, sortColumn, sortOrder);

    if (filter && filter instanceof Array) {
      for (const filterExpression of filter) {
        queryExpressions.push(filterExpression);
      }
    }

    const urlParts = this.url.split("?");

    if (urlParts.length > 1) {
      for (const expression of urlParts[1].split("&")) {
        queryExpressions.push(expression);
      }
    }

    const queryString = queryExpressions.join("&");
    const url = `${urlParts[0]}?${queryString}`;
    const responseMessage = await this.http.get(url);

    if (responseMessage.statusCode !== 200) {
      throw responseMessage;
    }

    const data = responseMessage.content;
    const totalRecords = data.totalRecords ? data.totalRecords : data.TotalRecords;
    const results = data.results ? data.results : data.Results;

    return {
      totalRecords: totalRecords,
      records: results,
      pageCount: Math.ceil(totalRecords / pageSize),
      currentPage: pageNumber
    };
  }

  private buildPagingQueryString(page: number, pageSize: number, sortPropertyName: string, sortOrder: SortOrder | undefined): string[] {
    return [
      `${this.pageParameterName}=${page}`,
      `${this.pageSizeParameterName}=${pageSize}`,
      `${this.sortOnParameterName}=${sortPropertyName}`,
      `${this.sortOrderParameterName}=${(sortOrder == SortOrder.Descending ? this.descConst : this.ascConst)}`
    ];
  }
}
