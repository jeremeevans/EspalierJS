import espalier from "../../espalier";
import graphProgress from "./templates/graphProgress";

let nextKey = new Object();

let getStepContent = (stepId, stepText, hasNext, hasBack) => {
    let stepContent = `<h3 id="${stepId}">${stepText}</h3>`;
    
    if(hasBack) {
        stepContent += `<a data-graph-event='back' href='javascript: void(0);' class='btn btn-primary'>Back</a> `
    }
    
    if(hasNext) {
        stepContent += `<a data-graph-event="next" href="javascript: void(0);" class="btn btn-primary">Next</a>`;
    }
    
    return stepContent;
};

export default class Step1 extends espalier.GraphNode {
    constructor() {
        super();
        this._internals = new WeakMap();
    }

    getValue() {
        return "This is step 1";
    }

    renderIn(container, result, steps) {
        let progress = graphProgress(steps);
        container.innerHTML = progress + getStepContent("step-1", this.getValue(), true, false);
    }

    next() {
        if (!this._internals.has(nextKey)) {
            this._internals.set(nextKey, new Step2dot1());
        }

        return this._internals.get(nextKey);
    }

    get propertyName() {
        return "StepOne";
    }

    get stepIndex() {
        return 0;
    }
}

class Step2dot1 extends espalier.GraphNode {
    constructor() {
        super();
        this._internals = new WeakMap();
    }

    getValue() {
        return "This is step 2.1";
    }

    renderIn(container, result, steps) {
        let progress = graphProgress(steps);
        container.innerHTML = progress + getStepContent("step-2dot1", this.getValue(), true, true);
    }

    next() {
        if (!this._internals.has(nextKey)) {
            this._internals.set(nextKey, new Step2dot2());
        }

        return this._internals.get(nextKey);
    }

    get propertyName() {
        return "StepTwoDotOne";
    }

    get stepIndex() {
        return 1;
    }
}

class Step2dot2 extends espalier.GraphNode {
    constructor() {
        super();
        this._internals = new WeakMap();
    }

    getValue() {
        return "This is step 2.2";
    }

    renderIn(container, result, steps) {
        let progress = graphProgress(steps);
        container.innerHTML = progress + getStepContent("step-2dot2", this.getValue(), true, true);
    }

    next() {
        if (!this._internals.has(nextKey)) {
            this._internals.set(nextKey, new Step3());
        }

        return this._internals.get(nextKey);
    }

    get propertyName() {
        return "StepTwoDotTwo";
    }

    get stepIndex() {
        return 1;
    }
}

class Step3 extends espalier.GraphNode {
    constructor() {
        super();
        this._internals = new WeakMap();
    }

    getValue() {
        return "This is step 3";
    }

    renderIn(container, result, steps) {
        let progress = graphProgress(steps);
        container.innerHTML = progress + getStepContent("step-3", this.getValue(), true, true);
    }

    next() {
        if (!this._internals.has(nextKey)) {
            this._internals.set(nextKey, new Step4());
        }

        return this._internals.get(nextKey);
    }

    get propertyName() {
        return "StepThree";
    }

    get stepIndex() {
        return 2;
    }
}

class Step4 extends espalier.GraphNode {
    constructor() {
        super();
    }

    getValue() {
        return "This is step 4";
    }

    renderIn(container, result, steps) {
        let progress = graphProgress(steps);
        container.innerHTML = progress + getStepContent("step-4", this.getValue(), false, true);
    }

    next() {
        return false;
    }

    get propertyName() {
        return "StepThree";
    }

    get stepIndex() {
        return 3;
    }
}