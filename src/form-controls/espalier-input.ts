import { bindable, customElement, bindingMode, inject } from "aurelia-framework";
import { IEspalierFormControl } from "./espalier-form-control";
import { ValidationController } from "aurelia-validation";
import { EventAggregator, Subscription } from "aurelia-event-aggregator";
import { MaskController } from "./mask-controller";
import { EspalierValidationRenderer } from "./espalier-validation-renderer";

@customElement("esp-input")
@inject(ValidationController, EventAggregator, EspalierValidationRenderer)
export class EspalierInput implements IEspalierFormControl {
  @bindable()
  public controlid: string;

  @bindable({ defaultBindingMode: bindingMode.twoWay })
  public value: string;

  @bindable()
  public type: string;

  @bindable()
  public mask: string;

  @bindable()
  public label: string;

  @bindable()
  public autocomplete: (value: string) => Promise<[string, any][]>;

  @bindable()
  public autocompleteSelected: (value: any) => Promise<void>;
  
  protected input: HTMLInputElement;
  protected selectedValue = "";
  protected focused = false;
  protected errors: string[] = [];
  private errorSub: Subscription;
  private removeErrorSub: Subscription;
  private maskController: MaskController;

  constructor(private controller: ValidationController, private eventAggregator: EventAggregator,
    private renderer: EspalierValidationRenderer) {
    controller.removeRenderer(renderer);
    controller.addRenderer(renderer);
  }

  public getControlId(): string {
    return this.controlid;
  }

  public focus() {
    this.focused = true;
    this.input.focus();
  }

  protected attached() {
    this.errorSub = this.eventAggregator.subscribe(`error:espalier:${this.controlid}`,
      (errorMessage: string) => this.errors.push(errorMessage));
    this.removeErrorSub = this.eventAggregator.subscribe(`removeerror:espalier:${this.controlid}`,
      (errorMessage: string) => {
        const index = this.errors.indexOf(errorMessage);
        if (index < 0) { return; }
        this.errors.splice(index, 1);
      }
    );
    this.input.addEventListener("focus", this.onFocus);
    this.input.addEventListener("blur", this.onBlur);

    if (this.mask || this.autocomplete) {
      this.maskController = new MaskController(this.input, this.mask, this.autocomplete, this.autocompleteSelected);
    }
  }

  protected detached() {
    this.input.removeEventListener("focus", this.onFocus);
    this.input.removeEventListener("blur", this.onBlur);
    this.errorSub.dispose();
    this.removeErrorSub.dispose();
    if (this.maskController) {
      this.maskController.dispose();
    }
  }

  private onBlur = async () => {
    this.focused = false;

    if (this.maskController) {
      this.value = this.input.value;
    }

    setTimeout(async () => {
      this.renderer.specificElement = this;
      await this.controller.validate();
      this.renderer.specificElement = undefined;
    }, 250);
  }

  private onFocus = () => {
    this.focused = true;
    this.input.setSelectionRange(0, this.input.value.length);
  }
}
