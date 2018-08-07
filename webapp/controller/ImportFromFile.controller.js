sap.ui.define([
        "carrpasp/controller/BaseController",
        "sap/m/MessageToast"
    ], function (BaseController, MessageToast) {
        "use strict";
        var arrNum;
        var arrSegId;
        var arrSegName;
//        var arrSeg;
        var arrSegValId;
        var arrSegValName;
        var arrSegValSegId;
//        var arrSegVal;
        var arrSegInHead;
        var oLog;
        var oFileUploader;

        function writeLog(atext) {
            if (oLog.getValue().length === 0) {
                oLog.setValue(atext);
            }
            else {
                oLog.setValue(oLog.getValue() + "\n" + atext); 
            }
        }

        return BaseController.extend("carrpasp.controller.ImportFromFile", {

            onNavBack : function() {
                history.go(-1);
            },
            

            onAfterRendering: function() {
                oLog = this.byId("textArea");
                oLog.setEnabled(false);
                writeLog("");


                var oModel = this.getModel();
                oModel.read("/CPASP", {
//                                filters : [new sap.ui.model.Filter("NUM","EQ","0001")],
                                success : function(oData) {
//                                    console.log("init found");
                                    var res = oData.results;
                                    arrNum = [];
                                    if (res) {
                                          res.forEach(function(item, i, arr) {
                                              arrNum.push(item.NUM);
                                        });
                                    }    
                                },
                                error: function(oEvt) {
                                    writeLog("Ошибка при чтении модели");
                                }
                });    
                oModel.read("/SEGMENT", {
                                success : function(oData) {
//                                    console.log("init found");
                                    var res = oData.results;
                                    arrSegId = [];
                                    arrSegName = [];
                                    if (res) {
                                          res.forEach(function(item, i, arr) {
                                              arrSegId.push(item.ID);
                                              arrSegName.push(item.NAME);
//                                              arrSeg = [arrSegId ,arrSegName];
                                        });
                                    }    
                                },
                                error: function(oEvt) {
                                    writeLog("Ошибка при чтении модели");
                                }
                });    
                oModel.read("/SEGVAL", {
                                success : function(oData) {
//                                    console.log("init found");
                                    var res = oData.results;
                                    arrSegValId = [];
                                    arrSegValName = [];
                                    arrSegValSegId = [];
                                    if (res) {
                                          res.forEach(function(item, i, arr) {
                                              arrSegValId.push(item.ID);
                                              arrSegValName.push(item.NAME);
                                              arrSegValSegId.push(item.SEGID);
//                                              arrSegVal = [arrSegValId, arrSegValName, arrSegValSegId];
                                        });
                                    }    
                                },
                                error: function(oEvt) {
                                    writeLog("Ошибка при чтении модели");
                                }
                });    
            },

            handleUploadComplete: function(oEvent) {
                var oFileToRead = oEvent.getSource().FUEl.files["0"];
                var reader = new FileReader();
                // Read file into memory as UTF-8 (файл должен быть именно UTF-8, иначе кракозябры)
                reader.readAsText(oFileToRead);
                
                reader.onload = loadHandler;

                reader.onerror = errorHandler;
                var oDataModel = this.getModel();

                
                function processData(csv) {

                    var allTextLines = csv.split(/\r\n|\n/);
                    var lines = [];
                    for (var i = 0; i < allTextLines.length; i++) {
                        var data = allTextLines[i].split(';');
                        if (data.toString().trim().length !== 0) {
                            var tarr = [];
                            for (var j = 0; j < data.length; j++) {
                                tarr.push(data[j]);
                            }
                            lines.push(tarr);
                        }
                    }
                    return lines;
                }

                function findNum(array, value) {

                    for (var i = 0; i < array.length; i++) {
                        if (array[i] === value) {return i; }
                    }
                    return -1;
                }

                function findSeg(array, value) {

                    for (var i = 0; i < array.length; i++) {
                        if (array[i].toUpperCase() === value) {return i; }
                    }
                    return -1;
                }
                

                function loadHandler(event) {
                    
                    oLog.setValue("");
                    writeLog("Загрузка из файла:");

                    var csv = event.target.result;
                    
                    var fileData = processData(csv);

                    var oProperties = {},
                        iNum,
                        iCreateDt,
                        iRegDt,
                        iPrimPrice,
                        iFactoryN,
                        iSegID,
                        iSegValID;
                    
                    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "dd.MM.yyyy", UTC: true });  // UTC для использования локального времени, иначе передаваемая дата в итоге оказывается на день меньше


                        arrSegInHead = [];
                        
                        // разбор заголовка, названия столбцов в файле соответствуют названиям столбцов в oData
                        var iExists = -1;
                        if (fileData) {
                            for (var i = 0; i < fileData[0].length; i++) {
                                switch (fileData[0][i].toUpperCase()) {
                                    case "NUM":
                                        iNum = i;
                                        break;
                                    case "CREATEDT":
                                        iCreateDt = i;
                                        break;
                                    case "REGDT":
                                        iRegDt = i;
                                        break;
                                    case "PRIMPRICE":
                                        iPrimPrice = i;
                                        break;
                                    case "FACTORYN":
                                        iFactoryN = i;
                                        break;
                                    default:
                                        iExists = findSeg(arrSegName, fileData[0][i].toUpperCase());
                                        if (iExists !== -1) {
                                            arrSegInHead[i] = fileData[0][i].toUpperCase();
                                        }    
                                }
                            }
                        }
                        

                        function OnSavePass(k, num) {
                            writeLog("Записан паспорт вагона с номером " + num);
                            oDataModel.read("/CPASPVAL", {
                                filters : [new sap.ui.model.Filter("CPASPNUM","EQ",num)],
                                success : function(oData) {
//                                    console.log("init found");
                                    var res = oData.results;
                                    if (res) {
                                          res.forEach(function(item, i1, arr) {
                                              oDataModel.remove("/CPASPVAL(" + item.ID + ")",oProperties,{
                                                groupId: "deleteGroup",
//                                                success: function(oData1) {console.log("Удален сегмент "); },
                                                error: function(response) {writeLog("Ошибка при удалении сегмента паспорта вагона Номер " + num + "     " + response); }
                                            });
                                        });
                                    }    
                                },
                                error: function(oEvt) {
                                    writeLog("Ошибка при чтении модели");
                                }
                            });    
                            for (var j = 0; j < arrSegInHead.length; j++) {
                                oProperties = {};
                                if (arrSegInHead[j]) {
                                    if (fileData[k][j]) {
                                        iExists = findSeg(arrSegName, arrSegInHead[j].toUpperCase());
                                        iSegID = arrSegId[iExists];
                                        iExists = findSeg(arrSegValName, fileData[k][j].toUpperCase());
                                        iSegValID = arrSegValId[iExists];
                                        oProperties.ID = "" + parseInt(Math.random() * 1000000000, 10);
                                        oProperties.CPASPNUM = "" + fileData[k][iNum];
                                        oProperties.SEGID = "" + iSegID; 
                                        oProperties.SEGVALID = "" + iSegValID;
                                        oDataModel.create("/CPASPVAL",oProperties,
                                            {
                                                groupId: "segsGroup",    
                                                error: function(response) {writeLog("Ошибка при записи сегмента паспорта вагона Номер" + num + "     " + response); }
                                            });  
                                    }    
                                }
                            }
                        }
                        
                        iExists = -1;
                        for (i = 1; i < fileData.length; i++) {
                            oProperties = {};
                            oProperties.NUM = "" + fileData[i][iNum];
                            if (fileData[i][iCreateDt]) {oProperties.CREATEDT = new Date(dateFormat.parse(fileData[i][iCreateDt]).getTime()); } else {oProperties.CREATEDT = null; }
                            if (fileData[i][iRegDt]) {oProperties.REGDT =  new Date(dateFormat.parse(fileData[i][iRegDt]).getTime()); } else {oProperties.REGDT = null; }
                            if (fileData[i][iPrimPrice]) {oProperties.PRIMPRICE = fileData[i][iPrimPrice]; } else {oProperties.PRIMPRICE = null; }
                            if (fileData[i][iFactoryN]) {oProperties.FACTORYN = fileData[i][iFactoryN]; } else {oProperties.FACTORYN = null; }


                            iExists = findNum(arrNum, oProperties.NUM);
                            if (iExists === -1) {
                                oDataModel.create("/CPASP",oProperties,{
                                            groupId: "createGroup",
                                            success: OnSavePass(i, oProperties.NUM),
                                            error: function(response) {writeLog("Ошибка при записи нового паспорта вагона Номер " +  oProperties.NUM + "  " + response); }
                                            });
                            }
                            else {
                                oDataModel.update("/CPASP('" + oProperties.NUM + "')",oProperties,{
                                            groupId: "createGroup",
                                            success: OnSavePass(i, oProperties.NUM),
                                            error: function(response) {writeLog("Ошибка при обновлении паспорта вагона Номер " +  oProperties.NUM + "  " + response); }
                                            });
                            }
                        }

                        oFileUploader.setValue("");
                        oFileUploader = null;
                        

/*                    oDataModel.submitChanges({
                        success: function(oData) {
                            console.log("success "+oData);
                        },
                        error : function(oData) {
                            console.log("save error "+oData);
                        }
                    });*/
//                    oDataModel.resetChanges();

                }
                
                
                
                function errorHandler(evt) {
                    if(evt.target.error.name === "NotReadableError") {
                        MessageToast.show("Ошибка при чтении файла!");
                    }
                }
            },
            
            
            
            handleUploadPress: function(oEvent) {
                oFileUploader = this.byId("fileUploader");
//                MessageToast.show(oFileUploader.getValue());
                oFileUploader.upload();
            }

        });

    }
);