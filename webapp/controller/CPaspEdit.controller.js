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
					//this.getOwnerComponent().getModel().resetChanges();
				}
			);
			
			this.fillSegsNum=null;

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		_onRouteMatched: function(oEvent) {

			//here goes your logic which will be executed when the "add" route is hit
			//will be done within the next unit
			this.getView().segvals=[];
			this.getView().contr=this;
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
			this.onNavBack();
		},

		/**
		 * Event handler for the save action
		 * @public
		 */
		onSave: function() {
			var oView = this.getView();
			var oModel = this.getModel();
			var segvals=oView.segvals;
			segvals.forEach(function(item, i, arr) {
				var inp = sap.ui.getCore().byId(item);
				if (inp) {
					var path = inp.getBindingContext().getPath();
					if (path) {
						if (oModel.getProperty(path+"/SEGID")&&!oModel.getProperty(path+"/SEGVALID")) {
							oModel.deleteCreatedEntry(inp.getBindingContext());
						}
					}
				}
			});

			this.getModel().submitChanges();
			
			/*var sId = this.getView().getBindingContext().getProperty("NUM");
			this.getRouter().navTo("cpaspView", {
				objectId : sId
			}, true);*/
			this.onNavBack();
		},		

		/**
		 * Event handler for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack : function() {
			//this.getModel().deleteCreatedEntry(this._oContext);
			this.getModel().resetChanges();

			/*var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {*/
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("cpaspView", {objectId : this.Num}, bReplace);
			//}
		},
		_bindView : function (sObjectPath) {
			var oViewModel = this.getModel("cpaspEdit"),
				oDataModel = this.getModel(),
				that = this;

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
						//that._fillSegVals();
						oViewModel.setProperty("/busy", false);
					}
				}
			});
//			debugger;
//that._fillSegVals();
		},
		_onBindingChange : function () {
				var 
					oViewModel = this.getModel("cpaspEdit");
				this._fillSegVals();

				// Everything went fine.
				oViewModel.setProperty("/busy", false);
		},
		
		_data_received : function(oEvent, that) {
			//var aggregatedData=oEvent.getParameters().data;
			var aggregatedData=oEvent;
			var segIds =[];
			if (aggregatedData && aggregatedData.results)
				segIds = aggregatedData.results.map(function(a) {return a.SEGID;});
			var oModel=this.getModel();
 		    var group = that.getView().byId("editsegGroup");
 		    var oView=that.getView();
 		    oView.segvals=[];
			oModel.read("/SEGMENT", {
									success : function(oData) {
									  console.log("success");
									  console.log(oData);
									  var segs=oData.results;
									  if (segs && group) {
									  	segs.forEach(function(item, i, arr) {
									  	if (segIds.indexOf(item.ID)<0) {
			                				oView.segvals.push("segval_"+item.ID);
							                
							                var ge=new sap.ui.comp.smartform.GroupElement("ge_"+item.ID);
											//ge.bindElement({path:"/SEGMENT("+item.ID+")"});
											var oProperties = {
												ID: "" + parseInt(Math.random() * 1000000000, 10),  // С какого-то перепугу с меня требует ID, который GENERATED BY DEFAULT AS IDENTITY
												CPASPNUM :""+oView.contr.Num,
												SEGID : item.ID
											};
										
											var oCurContext = oView.contr.getModel().createEntry(/*oView.getBindingContext().getPath()+*/"/CPASPVAL", {
												properties: oProperties
											});
									      	ge.setBindingContext(oCurContext);
											
												
							                var lb = new sap.m.Label('lb_'+item.ID,{text: "{NAME}"});
							                lb.bindElement({path:"/SEGMENT("+item.ID+")",
							                						events: {
												        					dataReceived: function(rData) {
												        						lb.bindProperty("text",{path: "NAME"});	
												        					}
							                						}
							                });
							                var attr= new sap.m.Input("segval_"+item.ID,{value: "{SEGVALID}",
             				                			showValueHelp : true,
			                							valueHelpOnly : true,
			                							textFormatMode : "Key",
			                							valueHelpRequest : function(oEvent) { 
			                								that.handleValueHelp(oEvent,that);
			                							}

							                });
							                attr.bindElement({path:"/CPASPVAL("+oProperties.ID+")",
							                						events: {
												        					dataReceived: function(rData) {
												        						attr.bindProperty("value",{path: "SEGVALID"});	
												        					}
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

			var dlg=sap.ui.getCore().byId("selectdialog");

				
			dlg.bindElement({path: "/SEGMENT("+sId+")",
					events: {
        					dataReceived: function(rData) {
        						dlg.bindProperty("title",{path: "NAME"});	
								that._valueHelpDialog.open(/*sInputValue*/);	
        					}
					}});
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
				var oContext=myInput.getBindingContext();
				oContext.getModel().setProperty(oContext.getPath()+"/SEGVALID",sDescription);
				myInput.getBinding("value").setValue(sDescription);

			//alert("sDescription=" + sDescription+" sTitle=" + sTitle);
			debugger;
			
			  //productInput.setTextFormatMode("Key");

				//myInput.setSelectedKey(sDescription);
				myInput.setValue(sTitle);
				//oText.setText(sDescription);
			}
			evt.getSource().getBinding("items").filter([]);
		},
		
		_fillSegVals : function() { 
			if (this.fillSegsNum==this.Num) return;
			this.fillSegsNum=this.Num;
			//this.getModel().resetChanges();
			var group = this.getView().byId("editsegGroup");
			var oView = this.getView();
			group.destroyGroupElements();
			var ofilter= [new sap.ui.model.Filter("CPASPNUM","EQ",this.Num)];
			var that = this;
			var oModel=this.getModel();
			debugger;
			oModel.read("/CPASPVAL", {
						parameters: {
			                               		 expand: 'VAL_SEGMENT, VAL_SEGVAL'
			                               },
			            filters : ofilter,
						success : function(oData) {
						  console.log("success");
						  console.log(oData);
						  var segs=oData.results;
						  if (segs && group) {
						  	segs.forEach(function(item, i, arr) {
                				oView.segvals.push("segval_"+item.ID);
				                var sId=item.SEGID;
				                var ge=new sap.ui.comp.smartform.GroupElement("ge_"+sId);
				                //var lb = new sap.m.Label('lb_'+sId,{text: "{/SEGMENT("+sId+")/NAME}"});
				                //var lb = new sap.m.Label('lb_'+sId,{text: "{VAL_SEGMENT/NAME}"});
				                ge.bindElement({path:"/CPASPVAL("+item.ID+"L)"/*,
				                						events: {
									        					dataReceived: function(rData) {
									        						lb.bindProperty("text",{path: "{/SEGMENT("+sId+")/NAME}"});	
									        					}
				                						}*/});
				                
				                var lb = new sap.m.Label('lb_'+sId,{text: "{NAME}"});
				                lb.bindElement({path:"/CPASPVAL("+item.ID+")/VAL_SEGMENT",
				                						events: {
									        					dataReceived: function(rData) {
									        						lb.bindProperty("text",{path: "NAME"});	
									        					}
				                						}
				                });

				                var inp= new sap.m.Input("segval_"+sId,{value: "{VAL_SEGVAL/NAME}",
				                			showValueHelp : true,
				                			valueHelpOnly : true,
				                			textFormatMode : "Key",
				                			valueHelpRequest : function(oEvent) { 
				                				  that.handleValueHelp(oEvent,that);
				                			}
				                });
				                inp.bindElement({path:"/CPASPVAL("+item.ID+")",
				                						events: {
									        					dataReceived: function(rData) {
									        						inp.bindProperty("value",{path: "VAL_SEGVAL/NAME"});	
									        					}
				                						}
				                });
				                /*inp.bindProperty("value","SEGVALID", function(aSprid) {
											//	alert("formatsprid");
												console.log("formatsegvalid "+aSprid);
												if (aSprid) {
													var oModel=inp.getModel();
													return oModel.getProperty("/SEGVAL("+aSprid+")/NAME"); 
												}
												return aSprid;
				                			});*/
				                
				                ge.addElement(lb);
				                ge.addElement(inp);
                				group.addGroupElement(ge);
						  	});
						  }
						  that._data_received(oData,that);
						}
			});
		},			


		_fillSegVals2 : function() { 
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
			debugger;
			group.bindAggregation("groupElements", {path: /*that.getView().getBindingContext().getPath()+*/"/CPASPVAL",
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
			                
			                that.getView().segvals.push("segval_"+oContext.getProperty().SEGID);
			                
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