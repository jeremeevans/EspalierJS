/**
 * EspalierFilter is an abstract class that should be implemented
 * by a custom control that represents the filter for your grid.
 */
export declare abstract class EspalierFilter {
    abstract container: HTMLElement;
    protected abstract model: any;
    private espalier;
    private lastAppliedState;
    /**
     * Return a query string that will be appended to the query string
     * Espalier generates for paging and sorting.
     */
    protected readonly abstract filterAsQueryString: string;
    /**
     * Bind your action for applying the filter to this method. It applies
     * the filter generated from filterAsQueryString() to your grid, resets
     * the grid to the first page, clones and stores your current model for
     * the filter (so it is remembered next time your filter is opened), and
     * closes the filter.
     */
    protected applyFilter(): Promise<any>;
    /**
     * Bind your action for canceling the filter to this method. It resets
     * the model to the last applied version of the filter, and closes the
     * filter.
     */
    protected cancel(): void;
}