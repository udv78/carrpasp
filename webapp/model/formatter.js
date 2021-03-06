sap.ui.define([
	], function () {
		"use strict";

		return {
			/**
			 * Rounds the currency value to 2 digits
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} formatted currency value with 2 digits
			 */
			currencyValue : function (sValue) {
				if (!sValue) {
					return "";
				}

				return parseFloat(sValue).toFixed(2);
			},
			reptypeValue : function (sValue) {
				if (!sValue) {
					return "";
				}
				if (sValue=="TO")
					return "ТО";
				if (sValue=="CRP")
					return "Капитальный ремонт";
				if (sValue=="ERP")
					return "Внеплановый ремонт";

				return "";
			},
			
			//https://maps.googleapis.com/maps/api/staticmap?zoom=9&size=640x640&center=55.563544,38.229801&markers=55.563544,38.229801&maptype=terrain
			formatMapUrl: function(latitude, longitude) {
				//console.log("latitude="+latitude+" longitude="+longitude);
				if (latitude && longitude)
					return "http://static-maps.yandex.ru/1.x/?ll="
					+ jQuery.sap.encodeURL(longitude + "," + latitude)
					+"&size=400,400&z=8&l=map&pt="
					+ jQuery.sap.encodeURL(longitude + "," + latitude)+",flag";
					/*return "http://maps.googleapis.com/maps/api/staticmap?zoom=9&size=400x400&center="
						+ jQuery.sap.encodeURL(latitude + "," + longitude)
						+"&markers="+jQuery.sap.encodeURL(latitude + "," + longitude)+
						"&maptype=terrain";*/
						//&key=AIzaSyBb15zjuw9ziqYrMNoY9H2jZ7phv4CJNiA";
				else return "";
			}
			
		};

	}
);