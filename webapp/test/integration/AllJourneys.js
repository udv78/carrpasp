jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 SEGMENT in the list
// * All 3 SEGMENT have at least one SEG_VAL

sap.ui.require([
	"sap/ui/test/Opa5",
	"carrpasp/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"carrpasp/test/integration/pages/App",
	"carrpasp/test/integration/pages/Browser",
	"carrpasp/test/integration/pages/Master",
	"carrpasp/test/integration/pages/Detail",
	"carrpasp/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "carrpasp.view."
	});

	sap.ui.require([
		"carrpasp/test/integration/MasterJourney",
		"carrpasp/test/integration/NavigationJourney",
		"carrpasp/test/integration/NotFoundJourney",
		"carrpasp/test/integration/BusyJourney"
	], function () {
		QUnit.start();
	});
});