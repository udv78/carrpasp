jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"carrpasp/test/integration/NavigationJourneyPhone",
		"carrpasp/test/integration/NotFoundJourneyPhone",
		"carrpasp/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});