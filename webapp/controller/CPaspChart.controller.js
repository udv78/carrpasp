sap.ui.define([
		"carrpasp/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"carrpasp/model/formatter",
		"sap/viz/ui5/format/ChartFormatter",
		"sap/viz/ui5/api/env/Format"
	], function (
		BaseController,
		JSONModel,
		History,
		formatter,
		ChartFormatter,
		Format
	) {
		"use strict";

		return BaseController.extend("carrpasp.controller.CPaspChart", {


			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var iOriginalBusyDelay,
					oViewModel = new JSONModel({
						busy : true,
						delay : 0,
						cpasp : []
					});
				var chartData= new JSONModel({
					cpaspchart : [
						{
							segValName : "Значение 1",
							count : 10
						},
						{
							segValName : "Значение 2",
							count : 20
						},
						{
							segValName : "Значение 3",
							count : 30
						}
					]
				});

				this.getRouter().getRoute("cpaspChart").attachPatternMatched(this._onObjectMatched, this);

				// Store original busy indicator delay, so it can be restored later on
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
				this.setModel(oViewModel, "cpaspChart");
				this.setModel(chartData, "cpaspChartData");
				this.getOwnerComponent().getModel().metadataLoaded().then(function () {
						// Restore original busy indicator delay for the object view
						oViewModel.setProperty("/delay", iOriginalBusyDelay);
					}.bind(this)
				);
				this.getRouter().getRoute("segmentTbl").attachPatternMatched(this._onObjectMatched, this);
				this.getRouter().attachBypassed(this.onBypassed, this);
				
				Format.numericFormatter(ChartFormatter.getInstance());
				var formatPattern = ChartFormatter.DefaultPattern;
				var oVizFrame = this.getView().byId("idViz");
				var oPopover = this.getView().byId("idPopover");
				oPopover.connect(oVizFrame.getVizUid());
				oPopover.setFormatString(formatPattern.STANDARDFLOAT);
			},
			
			_fillModel : function(segid, segText, mes, vizFrame) {
				var model=[];
				var oModel=this.getModel();
				var ofilter= [new sap.ui.model.Filter("SEGID","EQ",segid)];
				oModel.read("/CPASPVALV", {
										filters : ofilter,
										success : function(oData) {
										  var val=oData.results;
									  	  var caption="Количество";
										  if (val) {
										  	val.forEach(function(item, i, arr) {
											  	var cnt=item.CNT;
											  	if (mes=="PLUSSUM") {
											  		cnt=item.PLUSSUM;
											  		caption="Сумма дохода";
											  	}
											  	if (mes=="CARGO") {
											  		cnt=item.CARGO;
											  		caption="Вес перевезенного груза";
											  	}
											  	if (mes=="MINUSSUM") {
											  		cnt=item.MINUSSUM;
											  		caption="Расходы на обслуживание";
											  	}
											  	if (mes=="PROFIT") {
											  		cnt=Number(item.PLUSSUM)-Number(item.MINUSSUM);
											  		caption="Прибыль";
											  	}
											  	if (mes=="PROFITCARGO") {
											  		cnt=Number((Number(item.PLUSSUM)-Number(item.MINUSSUM))/Number(item.CARGO));
											  		caption="Прибыль на единицу груза";
											  	}
											  	if (mes=="KM") {
											  		cnt=item.PATHLEN;
											  		caption="Километраж";
											  	}
											  	if (mes=="MINUSKM") {
											  		cnt=Number(item.MINUSSUM)/Number(item.PATHLEN);
											  		caption="Расходы на километр";
											  	}
											  	if (mes=="PLUSKM") {
											  		cnt=Number(item.PLUSSUM)/Number(item.PATHLEN);
											  		caption="Доход на километр";
											  	}
											  	if (mes=="PROFITKM") {
											  		cnt=Number((Number(item.PLUSSUM)-Number(item.MINUSSUM))/Number(item.PATHLEN));
											  		caption="Прибыль на километр";
											  	}
											  	var o={segValName : item.NAME,
													count : cnt};
												model.push(o);
										  	});
										  }
										  
										  var data=this.getModel("cpaspChartData");
										  var newModel={cpaspchart:model};
										  data.setData(newModel);
										  this._updateViz(vizFrame,caption, segText);
										}.bind(this),
										error: function(oEvt) {
											console.log("error");
										}
									});		
	
			},
			
			_calcModel : function(segid,segText,mes) {
				var vizFrame=this.getView().byId("idViz");
				this._fillModel(segid,segText, mes,vizFrame);
			},
			
			_updateViz:function(vizFrame, caption, segText) {
					Format.numericFormatter(ChartFormatter.getInstance());
					var formatPattern = ChartFormatter.DefaultPattern;
					vizFrame.setModel(this.getModel("cpaspChartData"));
					vizFrame.setVizProperties({
						plotArea : {
							dataLabel: {
								visible: true   // НЕ РАБОТАЕТ!!!
							}	
						},
						categoryAxis : {
							title  : {
								text: segText
							}
						},
						valueAxis :{
							label: {
								visible : true,
								formatString: formatPattern.SHORTINTEGER
								
							},
							title: {
								text: caption
							}
						},
						title: {
							text: caption+' в разрезе значений сегмента'
						},
						legend : {
								visible: false
						},
						interaction: {
							selectability: {
								mode: "EXCLUSIVE"
							}
						}
					});
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */


			/**
			 * Event handler  for navigating back.
			 * It there is a history entry we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the worklist route.
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = History.getInstance().getPreviousHash();

				if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					this.getRouter().navTo("cpaspTbl", {}, true);
				}
			},
			
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				this.Num=sObjectId;
				if (this.getModel()) {
					this.getModel().metadataLoaded().then( function() {
						this._bindView("/SEGMENT");
					}.bind(this));
				}
			},
			
			onSegChange : function(oEvent) {
				var select = oEvent.getSource();
				var segid=select.getSelectedKey();
				this._calcModel(segid,  select.getSelectedItem().getText(), this.getView().byId("selectMeasure").getSelectedKey());
			},

			onMesChange : function(oEvent) {
				var select = oEvent.getSource();
				var mes=select.getSelectedKey();
				var select =this.getView().byId("selectSegment");
				this._calcModel(select.getSelectedKey(), select.getSelectedItem().getText(),mes);
			},

			/**
			 * Binds the view to the object path.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound
			 * @private
			 */
			_bindView : function (sObjectPath) {
				var oViewModel = this.getModel("cpaspChart"),
					oDataModel = this.getModel();

				this.getView().bindElement({
					path: sObjectPath,
					events: {
						change: this._onBindingChange.bind(this),
						dataRequested: function () {
							oDataModel.metadataLoaded().then(function () {
								// Busy indicator on view should only be set if metadata is loaded,
								// otherwise there may be two busy indications next to each other on the
								// screen. This happens because route matched handler already calls '_bindView'
								// while metadata is loaded.
								oViewModel.setProperty("/busy", true);
							});
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
				var seg= this.getView().byId("selectSegment");
				seg.getBinding("items").attachDataReceived(function(oEvent) {
					var segid= this.getView().byId("selectSegment").getItemAt(0).getProperty("key");
					var segtext= this.getView().byId("selectSegment").getItemAt(0).getProperty("text");
					this._calcModel(segid,segtext,this.getView().byId("selectMeasure").getItemAt(0).getProperty("key"));
				}, this);
			},
			
			_onBindingChange : function () {
				var oView = this.getView(),
					oViewModel = this.getModel("cpaspChart"),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				/*if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("notFound");
					return;
				}*/

				// Everything went fine.
				oViewModel.setProperty("/busy", false);
			}

		});

	}
);