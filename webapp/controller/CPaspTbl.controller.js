sap.ui.define([
		"carrpasp/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"carrpasp/model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageToast"
	], function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageToast) {
		"use strict";

		return BaseController.extend("carrpasp.controller.CPaspTbl", {

			formatter: formatter,
			

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {
				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");

				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				this._oTable = oTable;
				// keeps the search state
				this._oTableSearchState = [];

				// Model used to manipulate control states
				oViewModel = new JSONModel({
					cpasptTableTitle : this.getResourceBundle().getText("cpaspTableTitle"),
					tableNoDataText : this.getResourceBundle().getText("cpaspNoData"),
					tableBusyDelay : 0,
					cheap : 0,
					moderate : 0,
					expensive : 0
				});
				this.setModel(oViewModel, "cpaspView");

				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oTable.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});
			},


			onFilter: function() {
			    var bar=this.getView().byId("smartFilterBar");
			    var aFilters = bar.getFilters();
			    this.getView().byId("table").getBinding("items").filter(aFilters);
			},  

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished : function (oEvent) {
				// update the worklist's object counter after the table update
				var sTitle,
					oTable = oEvent.getSource(),
					iTotalItems = oEvent.getParameter("total"),
					oModel = this.getModel(),
					oViewModel = this.getModel("cpaspView");
				// only update the counter if the length is final and
				// the table is not empty
				/*if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
					jQuery.each(this._mFilters, function(sFilterKey, oFilter) {
						oModel.read("/ProductSet/$count", {
							filters : oFilter,
							success : function(oData) {
								var sPath = "/" + sFilterKey;
								oViewModel.setProperty(sPath,oData);
							}
						});	
					});					
				} else {*/
					sTitle = this.getResourceBundle().getText("cpaspTableTitle");
				//}
				this.getModel("cpaspView").setProperty("/cpaspTableTitle", sTitle);
			},
			
			/**
			 * Event handler when a filter tab gets pressed
			 * @param {sap.ui.base.Event} oEvent the filter tab event
			 * @public
			 */
/*			 onQuickFilter: function(oEvent) {
			 	var sKey = oEvent.getParameter("key"),
			 		oFilter = this._mFilters[sKey],
			 		oTable = this.byId("table"),
			 		oBinding = oTable.getBinding("items");
			 	if (oFilter) {
			 		oBinding.filter(oFilter);
			 	} else {
			 		oBinding.filter([]);
			 	}
			 },*/

			/**
			 * Event handler when a table item gets pressed
			 * @param {sap.ui.base.Event} oEvent the table selectionChange event
			 * @public
			 */
			onPress : function (oEvent) {
				// The source is the list item that got pressed
				this._showObject(oEvent.getSource());
			},

			onChart : function (oEvent) {
				// The source is the list item that got pressed
				this.getRouter().navTo("cpaspChart");
			},
 
			/*onDelete : function (oEvent) {

				var oSource = oEvent.getSource(); 
				var path=oSource.getBindingContext().getPath();
				var objToDelete = oSource.getBindingContext().getProperty("Name");
				this._oTable.getModel().remove(path);
				MessageToast.show("Deleted "+ objToDelete, {
								closeOnBrowserNavigation : false
							});
				
				//this.getModel().deleteCreatedEntry(this._oContext);
				//this._showObject(oEvent.getSource());
			},*/


			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
			onNavBack : function() {
				history.go(-1);
			},


			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
				} else {
					var oTableSearchState = [];
					var sQuery = oEvent.getParameter("query");

					if (sQuery && sQuery.length > 0) {
						oTableSearchState = [new Filter("NUM", FilterOperator.Contains, sQuery)];
					}
					this._applySearch(oTableSearchState);
				}

			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				this._oTable.getBinding("items").refresh();
			},
			
			/**
			 * Event handler when the add button gets pressed
			 * @public
			 */
			onAdd: function() {
		    	var dialog = this.byId("addDialog");

				this.oCurContext = this.getModel().createEntry("/CPASP");
		      	dialog.setBindingContext(this.oCurContext);
		      	this.getModel().resetChanges();
		      	dialog.open();
			},	
			
		   onCancelPress: function() {
		      this.byId("addDialog").close();
		      this.getModel().resetChanges();
		    },
		
		    onOkPress: function() {
		      if (!this.byId("editNum").getValue()) {
		      	alert("Необходимо указать номер вагона!");
		      	return;
		      }
		      this.byId("addDialog").close();
		      this.getModel().submitChanges();
		    },
			
			
						/**
			 * Event handler for press event on object identifier. 
			 * opens detail popover to show product dimensions.
			 * @public
			 */
			/*onShowDetailPopover : function (oEvent) {
				var oPopover = this._getPopover();
				var oSource = oEvent.getSource();
				oPopover.bindElement(oSource.getBindingContext().getPath());
				// open dialog
				oPopover.openBy(oEvent.getParameter("domRef"));
			},*/
			
			
			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */
		/*	_getPopover : function () {
			// create dialog lazily
				if (!this._oPopover) {
					// create popover via fragment factory
					this._oPopover = sap.ui.xmlfragment(
					"opensap.manageproducts.view.ResponsivePopover", this);
					this.getView().addDependent(this._oPopover);
				}
				return this._oPopover;
			},*/
			/**
			 * Shows the selected item on the object page
			 * On phones a additional history entry is created
			 * @param {sap.m.ObjectListItem} oItem selected Item
			 * @private
			 */
			_showObject : function (oItem) {
				this.getRouter().navTo("cpaspView", {
					objectId: oItem.getBindingContext().getProperty("NUM")
				});
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @param {object} oTableSearchState an array of filters for the search
			 * @private
			 */
			_applySearch: function(oTableSearchState) {
				var oViewModel = this.getModel("cpaspView");
				this._oTable.getBinding("items").filter(oTableSearchState, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (oTableSearchState.length !== 0) {
					oViewModel.setProperty("/cpaspNoData", this.getResourceBundle().getText("cpaspNoData"));
				}
			}

		});
	}
);