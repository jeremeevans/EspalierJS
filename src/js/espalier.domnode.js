import isString from "./helpers/is-string";
import addListener from "./helpers/add-listener";
import singleOrError from "./helpers/single-or-error";
import matches from "./helpers/matches";

let rootNode = document.createElement("div");
let keys = {
    node: new Object()
};

export default class EspalierNode {
    constructor(node) {
        this._internals = new WeakMap();

        if (isString(node)) {
            rootNode.innerHTML = node;
            node = rootNode.firstChild;
        }

        node = singleOrError(node);

        this._internals.set(keys.node, node);
    }

    getNode() {
        return this._internals.get(keys.node);
    }

    append(stuff) {
        let node = this.getNode();

        if (isString(stuff)) {
            rootNode.innerHTML = stuff;

            for (let child of rootNode.childNodes) {
                node.appendChild(child);
            }
            return;
        }

        node.appendChild(stuff);
    }

    html(stuff) {
        this.getNode().innerHTML = "";
        this.append(stuff);
    }

    on(event, selector, func) {
        let node = this.getNode();

        addListener(node, event, (e) => {
            let target = e.target;

            while (target && target != node) {
                if (matches(target, selector)) {
                    func(target);
                }

                target = target.parentNode;
            }
        });
    }

    remove() {
        let node = this.getNode();
        node.parentNode.removeChild(node);
    }
}