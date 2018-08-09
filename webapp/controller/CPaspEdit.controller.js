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
					this.getModel().resetChanges();
				}.bind(this)
			);
			
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

			this.getModel().submitChanges({
				success: function(oData) {
					this.onNavBack();
				}.bind(this),
				error : function(oData) {
					console.log("save error "+oData);
				}
			});
			
			/*var sId = this.getView().getBindingContext().getProperty("NUM");
			this.getRouter().navTo("cpaspView", {
				objectId : sId
			}, true);*/
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

			var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("cpaspView", {objectId : this.Num}, bReplace);
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
//			debugger;

		},
		_onBindingChange : function () {
				var 
					oViewModel = this.getModel("cpaspEdit");
				this._fillSegVals();

				// Everything went fine.
				oViewModel.setProperty("/busy", false);
		},
		
		_fill_empty_segs : function(oEvent, that) {
			//var aggregatedData=oEvent.getParameters().data;
			var aggregatedData=oEvent;
			var segIds =[];
			if (aggregatedData && aggregatedData.results)
				segIds = aggregatedData.results.map(function(a) {return a.SEGID;});
			var oModel=this.getModel();
 		    var group = that.getView().byId("editsegGroup");
 		    var oView=that.getView();
 		    oView.segvals=[];
            var width = this.getView().$().width();
            var align=sap.ui.core.TextAlign.End;
            if (width<500)
            	align=sap.ui.core.TextAlign.Begin;
 		    
			oModel.read("/SEGMENT", {
									sorters : [new sap.ui.model.Sorter("NAME")],
									success : function(oData) {
//									  console.log("success");
//									  console.log(oData);
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

												
							                var lb = new sap.m.Label('lb_'+item.ID,{text: "{NAME}", textAlign: align});
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
							                attr.bindElement({path:oCurContext.getPath()/*"/CPASPVAL("+oProperties.ID+"L)"*/,
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
					sId = oSelectedItem.getDescription(),
					sTitle = oSelectedItem.getTitle();
				
				myInput.getBinding("value").setBindingMode("OneWay");
				myInput.getBinding("value").sMode="OneWay";
				var ge=myInput.getParent();
				var oContext=ge.getBindingContext();
				oContext.getModel().setProperty(oContext.getPath()+"/SEGVALID",sId);

				myInput.setValue(sTitle);
			}
			evt.getSource().getBinding("items").filter([]);
		},
		
		_fillSegVals : function() { 
			var group = this.getView().byId("editsegGroup");
			var oView = this.getView();
			group.destroyGroupElements();
			var ofilter= [new sap.ui.model.Filter("CPASPNUM","EQ",this.Num)];
			var that = this;
			var oModel=this.getModel();
            var width = this.getView().$().width();
            var align=sap.ui.core.TextAlign.End;
            if (width<500)
            	align=sap.ui.core.TextAlign.Begin;
			//debugger;
			oModel.read("/CPASPVAL", {
						parameters: {
			                               		 expand: 'VAL_SEGMENT, VAL_SEGVAL'
			                               },
			            filters : ofilter,
			            sorters : [new sap.ui.model.Sorter("VAL_SEGMENT/NAME")],
						success : function(oData) {
						  //console.log("success");
						  //console.log(oData);
						  var segs=oData.results;
						  if (segs && group) {
						  	segs.forEach(function(item, i, arr) {
                				oView.segvals.push("segval_"+item.ID);
				                var sId=item.SEGID;
				                var ge=new sap.ui.comp.smartform.GroupElement("ge_"+sId);
				                ge.bindElement({path:"/CPASPVAL("+item.ID+"L)"
				                						});
				                var lb = new sap.m.Label('lb_'+sId,{text: "{NAME}", textAlign: align});
				                lb.bindElement({path:"/CPASPVAL("+item.ID+")/VAL_SEGMENT",
				                						events: {
									        					dataReceived: function(rData) {
									        						lb.bindProperty("text",{path: "NAME"});	
									        					}
				                						}
				                });


				                var inp= new sap.m.Input("segval_"+sId,{/*value: "{VAL_SEGVAL/NAME}",*/
				                			showValueHelp : true,
				                			valueHelpOnly : true,
				                			textFormatMode : "Key",
				                			valueHelpRequest : function(oEvent) { 
				                				  that.handleValueHelp(oEvent,that);
				                			}
				                });

				                inp.bindElement({path:"/CPASPVAL("+item.ID+")/VAL_SEGVAL",
				                						events: {
									        					dataReceived: function(rData) {
									        						inp.bindProperty("value",{path: "NAME"});	
									        					}
				                						}
				                });
								ge.addElement(lb);
   				                ge.addElement(inp);
                				group.addGroupElement(ge);
						  	});
						  }
						  that._fill_empty_segs(oData,that);
						}
			});
		}			

		});	
		
	});