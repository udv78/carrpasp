sap.ui.define([		
	"carrpasp/controller/BaseController",		
	"sap/ui/core/routing/History",
	"sap/ui/model/json/JSONModel"
], 
	function (BaseController, History, JSONModel) {
		"use strict";		
		return BaseController.extend("carrpasp.controller.CPaspEdit", {	
	/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the add controller is instantiated.
		 * @public
		 */
		onInit: function() {

			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy : true,
					delay : 0
				});
			
			// Register to the add route matched
			this.getRouter().getRoute("cpaspEdit").attachPatternMatched(this._onRouteMatched, this);
	
			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "cpaspEdit");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
					// Restore original busy indicator delay for the object view
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				}
			);



		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		_onRouteMatched: function(oEvent) {

			//here goes your logic which will be executed when the "add" route is hit
			//will be done within the next unit

			var sObjectId =  oEvent.getParameter("arguments").objectId;
			this.Num=sObjectId;
			if (this.getModel()) {
				this.getModel().metadataLoaded().then( function() {
					var sObjectPath = this.getModel().createKey("CPASP", {
						NUM :  sObjectId
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));
			}
		},
		
		onCancel: function() {
			this.getModel().resetChanges();
			this.onNavBack();
		},

		/**
		 * Event handler for the save action
		 * @public
		 */
		onSave: function() {
			this.getModel().submitChanges();
			
			var sId = this.getView().getBindingContext().getProperty("NUM");
			this.getRouter().navTo("cpaspView", {
				objectId : sId
			}, true);
			
		},		

		/**
		 * Event handler for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack : function() {
			//this.getModel().deleteCreatedEntry(this._oContext);

			var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("cpaspView", {}, bReplace);
			}
		},
		_bindView : function (sObjectPath) {
			var oViewModel = this.getModel("cpaspEdit"),
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
			this._fillSegVals();
		},
		_onBindingChange : function () {
				var 
					oViewModel = this.getModel("cpaspEdit");

				// Everything went fine.
				oViewModel.setProperty("/busy", false);
		},
		
		_data_received : function(oEvent, that) {
			var aggregatedData=oEvent.getParameters().data;
			var segIds =[];
			if (aggregatedData && aggregatedData.results)
				segIds = aggregatedData.results.map(function(a) {return a.SEGID;});
			var oModel=this.getModel();
 		    var group = that.getView().byId("editsegGroup");
 		    var oView=that.getView();
			oModel.read("/SEGMENT", {
									success : function(oData) {
									  console.log("success");
									  console.log(oData);
									  var segs=oData.results;
									  if (segs && group) {
									  	segs.forEach(function(item, i, arr) {
									  	if (segIds.indexOf(item.ID)<0) {
							                var ge=new sap.ui.comp.smartform.GroupElement("ge_"+item.ID);
											ge.bindElement({path:"/SEGMENT("+item.ID+")"});

							                var lb = new sap.m.Label('lb_'+item.ID,{text: "{NAME}"});
							                var attr= new sap.m.Input("segval_"+item.ID,{value: "{NAME}",
             				                			showValueHelp : true,
			                							valueHelpOnly : true,
			                							textFormatMode : "Key",
			                							valueHelpRequest : function(oEvent) { 
			                								that.handleValueHelp(oEvent,that);
			                							}

							                });
										  	ge.addElement(lb);
				                			ge.addElement(attr);		
			                				group.addGroupElement(ge);
									  	}
									  	});
									  }
									  
									},
									error: function(oEvt) {
										console.log("error");
									}
								});		
		},
		
		handleValueHelp : function(oEvent, that) {
			var sInputValue = oEvent.getSource().getValue();

			that.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog) {
				that._valueHelpDialog = sap.ui.xmlfragment(
					"carrpasp.view.ValueHelpDialog",
					this
				);
				that.getView().addDependent(this._valueHelpDialog);
			}
	        var sId=that.inputId.replace("segval_","");

			that._valueHelpDialog.bindElement(
				{
					path:"/SEGMENT("+sId+")",
					events: {
        					dataReceived: function(rData) {
            					that._valueHelpDialog.open(/*sInputValue*/);
        					}
					}
			});
		},
		
		_handleValueHelpClose : function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var myInput = sap.ui.getCore().byId(this.inputId),
					//oText = this.getView().byId('selectedKey'),
					sDescription = oSelectedItem.getDescription(),
					sTitle = oSelectedItem.getTitle();
				
				myInput.getBinding("value").setBindingMode("OneWay");
				myInput.getBinding("value").sMode="OneWay";
				myInput.getBinding("value").setValue(sDescription);

			//alert("sDescription=" + sDescription);
			debugger;
			
			  //productInput.setTextFormatMode("Key");

				myInput.setSelectedKey(sDescription);
				myInput.setValue(sTitle);
				//oText.setText(sDescription);
			}
			evt.getSource().getBinding("items").filter([]);
		},
		

		_fillSegVals : function() { 
			var group = this.getView().byId("editsegGroup");
			group.destroyGroupElements();
			var ofilter= [new sap.ui.model.Filter("CPASPNUM","EQ",this.Num)];
			var that = this;
			//var ge=this.getView().byId("editsegGroupElement");
			//var oModel=this.getModel();
			/*oModel.read("/SEGMENT", {
									success : function(oData) {
									ge.bindElement( {path: "/SEGMENT(1)"}
										);
									var ed = new sap.m.Input("segv_112",{value: "{NAME}"});
									ge.addElement(ed);
									}});
			return;*/
			
			
			var oModel=this.getModel();
			/*oModel.read("/CPASPVAL", {
									filters : ofilter,
									success : function(oData) {
									  console.log("success");
									  console.log(oData);
									},
									error: function(oEvt) {
										console.log("error");
									}
								});			*/
			group.bindAggregation("groupElements", {path: "/CPASPVAL",
			                               parameters: {
			                               		 expand: 'VAL_SEGMENT,VAL_SEGVAL'
			                               },
			                               filters : ofilter,
			                               events : {

											    dataReceived : function(oEvent) {
											    	 that._data_received(oEvent,that);
											    }

											},
				                           factory : function (sId, oContext) {   
			                var ge=new sap.ui.comp.smartform.GroupElement("ge_"+sId);
			                
			                var lb = new sap.m.Label('lb_'+sId,{text: "{VAL_SEGMENT/NAME}"});
			                var inp= new sap.m.Input("segval_"+oContext.getProperty().SEGID,{value: "{SEGVALID}",
			                			showValueHelp : true,
			                			valueHelpOnly : true,
			                			textFormatMode : "Key",
			                			valueHelpRequest : function(oEvent) { 
			                				  that.handleValueHelp(oEvent,that);
			                			}
			                });
			                
			                ge.addElement(lb);
			                ge.addElement(inp);
			                return ge;
			}});  
		}			
		});	
		
	});