sap.ui.define([
		"carrpasp/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"carrpasp/model/formatter",
		"sap/m/MessageBox"
	], function (BaseController, JSONModel, formatter, MessageBox) {
		"use strict";

		return BaseController.extend("carrpasp.controller.RepairTbl", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var oViewModel = new JSONModel({
					busy : false,
					delay : 0,
					lineItemListTitle : this.getResourceBundle().getText("repairTblTitle")
				});

				this.getRouter().getRoute("cpaspView").attachPatternMatched(this._onObjectMatched, this);

				this.setModel(oViewModel, "repairTbl");

				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Event handler when the share by E-Mail button has been clicked
			 * @public
			 */

			/**
			 * Updates the item count within the line item table's header
			 * @param {object} oEvent an event containing the total number of items in the list
			 * @private
			 */
			onListUpdateFinished : function (oEvent) {
				var sTitle, sLast,
					iTotalItems = oEvent.getParameter("total"),
					oViewModel = this.getModel("repairTbl"),
					tbl=this.byId("repairItemsList");

				// only update the counter if the length is final
				if (this.byId("repairItemsList").getBinding("items").isLengthFinal()) {
					if (iTotalItems) {
						sTitle = this.getResourceBundle().getText("cpaspRepair", [iTotalItems]);
						var items=tbl.getItems();
						if (items.length>0) {
							var model = this.getModel();
							var oFormatDate = sap.ui.core.format.DateFormat.getDateInstance({
								pattern: "dd.MM.yyyy"
							});
							sLast= formatter.reptypeValue(model.getProperty(items[0].getBindingContext().getPath()+"/REPTYPE")) +
							" от "+
							oFormatDate.format(model.getProperty(items[0].getBindingContext().getPath()+"/DT"));
						}
						
					} else {
						sTitle = this.getResourceBundle().getText("cpaspRepair", [0]);
						sLast="Нет данных";
					}
					this.getModel("cpaspView").setProperty("/repairTblTitle", sTitle);
					this.getModel("cpaspView").setProperty("/lastRepairInfo", sLast);
				}
			},
			
			handleChange : function(oEvent) {
				// какая-то непонятная проблема с выбором даты - откатывает на день назад от выбранной.
				// По всей видимости, проблема с часовым поясом. Ниче лучше не придумал пока, как тупо добавить минут
				var oDatePicker = oEvent.getSource();
				var oBinding = oDatePicker.getBinding("value");
				var oNewDate = oDatePicker.getDateValue();
				if (oNewDate) {
					var sPath = oBinding.getContext().getPath() + "/" + oBinding.getPath();
					var oFormatDate = sap.ui.core.format.DateFormat.getDateTimeInstance({
						pattern: "yyyy-MM-ddTKK:mm:ss"
					});
					var d = new Date(oFormatDate.format(oNewDate));
					d.setMinutes( d.getMinutes() + 480 );
					oBinding.getModel().setProperty(sPath, d);
				}				
			},
			
			onLineSelect : function (oEvent) {
				this.oCurContext = oEvent.getSource().getBindingContext();
			},
			
			onFilter: function() {
			    var bar=this.getView().byId("smartFilterBar");
			    var aFilters = bar.getFilters();
			    this.getView().byId("repairItemsList").getBinding("items").filter(aFilters);
			},  

			onAdd : function(event) {
		      var dialog = this.byId("repairDialog");
				var oProperties = {
					ID: "" + parseInt(Math.random() * 1000000000, 10),  // С какого-то перепугу с меня требует ID, который GENERATED BY DEFAULT AS IDENTITY
					CNUM : ""+this.masterId,
					REPTYPE : "TO"
				};
			
				this.oCurContext = this.getModel().createEntry("/REPAIRS", {
					properties: oProperties
				});
		      	dialog.setBindingContext(this.oCurContext);
		      	dialog.open();
			},

			onUpd : function(event) {
		      var dialog = this.byId("repairDialog");
		      if (this.oCurContext) {
		      	dialog.setBindingContext(this.oCurContext);
		      	dialog.open();
		      }
			},

			onDel : function (oEvent) {

				if (this.oCurContext) {
					var path=this.oCurContext.getPath();
					MessageBox.show(
						this.getResourceBundle().getText("confirmDeleteText"), {
							icon: MessageBox.Icon.QUESTION,
							title: this.getResourceBundle().getText("confirmDeleteTitle"),
							actions: [MessageBox.Action.YES, MessageBox.Action.NO],
							onClose: function(sAnswer) {
								if (sAnswer === MessageBox.Action.YES) {
									this.getModel().remove(path);
								}
							}.bind(this)
						}
					);					
				}
			},

		   onCancelPress: function() {
		      this.byId("repairDialog").close();
		      this.getModel().resetChanges();
		    },
		
		    onOkPress: function() {
		      this.byId("repairDialog").close();
		      this.getModel().submitChanges();
		    },


			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */

			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				this.masterId = sObjectId;
				if (this.getModel()) {
					this.getModel().metadataLoaded().then( function() {
						var sObjectPath = this.getModel().createKey("CPASP", {
							NUM :  sObjectId
						});
						this._bindView("/" + sObjectPath);
					}.bind(this));
				}
			},

			/**
			 * Binds the view to the object path. Makes sure that detail view displays
			 * a busy indicator while data for the corresponding element binding is loaded.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound to the view.
			 * @private
			 */
			_bindView : function (sObjectPath) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("repairTbl");

				// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
				oViewModel.setProperty("/busy", false);

				this.getView().bindElement({
					path : sObjectPath,
					events: {
						change : this._onBindingChange.bind(this),
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},

			_onBindingChange : function () {
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("notFound");
					// if object could not be found, the selection in the master list
					// does not make sense anymore.
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
					return;
				}

				var sPath = oElementBinding.getPath();/*,
					oResourceBundle = this.getResourceBundle(),
					oObject = oView.getModel().getObject(sPath),
					sObjectId = oObject.ID,
					sObjectName = oObject.NAME,
					oViewModel = this.getModel("repairTbl");*/

				this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			},

			_onMetadataLoaded : function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
					oViewModel = this.getModel("repairTbl"),
					oLineItemTable = this.byId("repairItemsList"),
					iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

				// Make sure busy indicator is displayed immediately when
				// detail view is displayed for the first time
				oViewModel.setProperty("/delay", 0);
				oViewModel.setProperty("/lineItemTableDelay", 0);

				oLineItemTable.attachEventOnce("updateFinished", function() {
					// Restore original busy indicator delay for line item table
					oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
				});

				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			}

		});

	}
);