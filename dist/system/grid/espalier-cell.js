System.register(["aurelia-framework", "./enums", "./formatters/formatters"], function (exports_1, context_1) {
    "use strict";
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __moduleName = context_1 && context_1.id;
    var aurelia_framework_1, enums_1, formatters_1, EspalierCell;
    return {
        setters: [
            function (aurelia_framework_1_1) {
                aurelia_framework_1 = aurelia_framework_1_1;
            },
            function (enums_1_1) {
                enums_1 = enums_1_1;
            },
            function (formatters_1_1) {
                formatters_1 = formatters_1_1;
            }
        ],
        execute: function () {
            EspalierCell = /** @class */ (function () {
                function EspalierCell(viewSlot, container) {
                    this.viewSlot = viewSlot;
                    this.container = container;
                    this.isAttached = false;
                }
                Object.defineProperty(EspalierCell.prototype, "className", {
                    get: function () {
                        switch (this.column.type) {
                            case enums_1.ColumnType.Currency:
                                return "currency-cell";
                            case enums_1.ColumnType.Date:
                                return "date-cell";
                            case enums_1.ColumnType.DateTime:
                                return "date-time-cell";
                            case enums_1.ColumnType.Number:
                                return "number-cell";
                            case enums_1.ColumnType.Time:
                                return "time-cell";
                            case enums_1.ColumnType.Integer:
                                return "time-integer";
                            default:
                                return "default-cell";
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
                EspalierCell.prototype.attached = function () {
                    this.isAttached = true;
                    this.loadView();
                };
                EspalierCell.prototype.viewChanged = function () {
                    if (this.isAttached) {
                        this.loadView();
                    }
                };
                EspalierCell.prototype.loadView = function () {
                    var _this = this;
                    if (this.column.onClick) {
                        this.onClick = function () {
                            if (_this.column.onClick == undefined) {
                                return;
                            }
                            _this.column.onClick(_this.record);
                        };
                    }
                    var propertyValue = this.record;
                    var paths = this.column.propertyName.split(".");
                    for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
                        var path = paths_1[_i];
                        if (propertyValue) {
                            propertyValue = propertyValue[path];
                        }
                    }
                    var formatter = this.column.dataFormatter;
                    if (!formatter) {
                        formatter = new formatters_1.TextFormatter();
                    }
                    this.data = formatter.format(propertyValue, this.record);
                    var view = this.view.create(this.container);
                    view.bind(this);
                    this.viewSlot.add(view);
                    this.viewSlot.attached();
                };
                __decorate([
                    aurelia_framework_1.bindable
                ], EspalierCell.prototype, "column", void 0);
                __decorate([
                    aurelia_framework_1.bindable
                ], EspalierCell.prototype, "record", void 0);
                __decorate([
                    aurelia_framework_1.bindable
                ], EspalierCell.prototype, "view", void 0);
                EspalierCell = __decorate([
                    aurelia_framework_1.customElement("espalier-cell"),
                    aurelia_framework_1.noView(),
                    aurelia_framework_1.inject(aurelia_framework_1.ViewSlot, aurelia_framework_1.Container)
                ], EspalierCell);
                return EspalierCell;
            }());
            exports_1("EspalierCell", EspalierCell);
        }
    };
});