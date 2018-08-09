sap.ui.define([
		"carrpasp/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"carrpasp/model/formatter",
		"sap/m/MessageBox"
	], function (BaseController, JSONModel, formatter, MessageBox) {
		"use strict";

		return BaseController.extend("carrpasp.controller.CoordTbl", {

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
					lineItemListTitle : this.getResourceBundle().getText("coordTblTitle"),
					"latitude" : 55.563544,
					"longitude" : 38.229801
				});

				this.getRouter().getRoute("cpaspView").attachPatternMatched(this._onObjectMatched, this);

				this.setModel(oViewModel, "coordTbl");

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
				var sTitle, sLastText, sLastCoord,
					iTotalItems = oEvent.getParameter("total"),
					oViewModel = this.getModel("coordTbl"),
					tbl=this.byId("coordItemsList");

				// only update the counter if the length is final
				if (this.byId("coordItemsList").getBinding("items").isLengthFinal()) {
					if (iTotalItems) {
						sTitle = this.getResourceBundle().getText("coordsTblTitleCount", [iTotalItems]);
						var items=tbl.getItems();
						if (items.length>0) {
							var model = this.getModel();
							var oFormatDate = sap.ui.core.format.DateFormat.getDateInstance({
								pattern: "dd.MM.yyyy HH:mm:ss"
							});
							sLastText="Местоположение на "+
							oFormatDate.format(model.getProperty(items[0].getBindingContext().getPath()+"/G_CREATED"));
							sLastCoord=formatter.formatMapUrl(model.getProperty(items[0].getBindingContext().getPath()+"/C_LATITUDE"),
							model.getProperty(items[0].getBindingContext().getPath()+"/C_LONGITUDE"));
							this.byId("map").setVisible(true);
						}
					} else {
						sTitle = this.getResourceBundle().getText("coordsTblTitleCount", [0]);
						sLastText = "Нет данных о местоположении";
						sLastCoord = "";
						this.byId("map").setVisible(false);
					}
					this.getModel("cpaspView").setProperty("/coordTblTitle", sTitle);
					this.getModel("cpaspView").setProperty("/lastCoordText", sLastText);
					this.getModel("cpaspView").setProperty("/lastCoord", sLastCoord);
				}
			},
			
			onLineItemSelected : function(oEvent) {
				var oColumnListItem = oEvent.getSource();
			    var oTable = oColumnListItem.getParent();
			    oTable.setSelectedItem(oColumnListItem);
				var coordModel=this.getModel("coordTbl"),
					model=this.getModel();
				this.oCurContext = oEvent.getSource().getBindingContext();
				coordModel.setProperty("/latitude",model.getProperty(this.oCurContext.getPath()+"/C_LATITUDE"));
				coordModel.setProperty("/longitude",model.getProperty(this.oCurContext.getPath()+"/C_LONGITUDE"));
			},
			
			onFilter: function() {
			    var bar=this.getView().byId("smartFilterBar");
			    var aFilters = bar.getFilters();
			    this.getView().byId("repairItemsList").getBinding("items").filter(aFilters);
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


			_bindView : function (sObjectPath) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("coordTbl");

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
						}.bind(this)
					}
				});
				//this.getView().byId("map").setModel(oViewModel);
				//this.getView().byId("map").bindElement("/coordTbl");
			},

			_onBindingChange : function () {
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();
					var deviceid=this.getModel().getProperty(oElementBinding.getPath()+"/DEVICEID");
					var ofilter= [new sap.ui.model.Filter("G_DEVICE","EQ",deviceid/*"b87c07bd-7a87-4cfd-8fae-c5027b01faa7"*/)];
					var that=this;
				    this.getView().byId("coordItemsList").bindAggregation("items",
			    
														{path: "/COORDS",
							                               filters : ofilter,
							                               sorter : [new sap.ui.model.Sorter("G_CREATED",true)],
								                           factory : function (sId, oContext) {   
							                var attr= new sap.m.ColumnListItem(
										         { type : sap.m.ListType.Active,
										           press : function(oEvent) {that.onLineItemSelected(oEvent);},
										         	cells : [
										
										              new sap.m.Text({
										
										                   text : {path: 'G_CREATED', 
										                			type:'sap.ui.model.type.DateTime', 
										                			pattern: 'dd.MM.yyyy HH:mm:ss' }
										
										              }),
														new sap.m.ObjectNumber({
										
										                   number : { path: 'C_LATITUDE', 
										                    		type:'sap.ui.model.type.Float'}
										
										              }),
														new sap.m.ObjectNumber({
										
										                   number : { path: 'C_LONGITUDE', 
										                    		type:'sap.ui.model.type.Float'}
										
										              })
										         ]}								                
							                	);
							                return attr;
							}});  					    
			},


//https://maps.googleapis.com/maps/api/staticmap?zoom=9&size=640x640&center=55.563544,38.229801&markers=55.563544,38.229801&maptype=terrain
			_onMetadataLoaded : function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
					oViewModel = this.getModel("coordTbl"),
					oLineItemTable = this.byId("coordItemsList"),
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
				//oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			}

		});

	}
);