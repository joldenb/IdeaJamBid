var express = require('express');
var passport = require('passport');
var mongoose = require('mongoose');
var _ = require('underscore');
var ObjectId = mongoose.Schema.Types.ObjectId;
var aws = require('aws-sdk');
var env = require('node-env-file');
var IdeaImage = require('../models/ideaImage');
var Aptitude = require('../models/aptitude');
var IdeaReview = require('../models/ideaReviews');
var IdeaSeed = require('../models/ideaSeed');
var Component = require('../models/component');
var Network = require('../models/network');
var IdeaProblem = require('../models/ideaProblem');
var Account = require('../models/account');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var sanitizer = require('sanitizer');
var mongoSanitize = require('mongo-sanitize');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

var getApplicationStrength = function getApplicationStrength(ideaSeedID){

	return new Promise(
		function (resolve, reject) {
		/*
			We start with the simplest requirements, then build from there to determine
			the strength and readiness of the application to submit to the USPTO 
		*/
		getStrengthData(ideaSeedID).then(function(strengthData){
			var strengthResponse = {};
			var almostReqsFulfilled = 0; //must be at least 3 to meet the middle rung of app strength 'almost'

			if(strengthData['description'] != '' &&
					strengthData['problem'] != '' &&
					strengthData['name'] != ''){

				strengthResponse['appStrengthText'] = 'NOT YET...';
				strengthResponse['appStrengthClass'] = 'not-yet col-md-4';

			}

			/*
				To get the middle level of readiness, the user must have completed
				three or more of the following:
				
				Two or more uploaded images - 
				One or more component/annotation per uploaded image
				One or more relationship between components per component
				Three or more issues - 
				One or more suggestion per issue
				Four or more viability scores - 
			*/

			if(strengthData['images'].length >= 2 ){
				almostReqsFulfilled++;
			}

			if(strengthData['issues'].length >= 3){
				almostReqsFulfilled++;
			}
			
			if(strengthData['viabilityScores'].length >= 4){
				almostReqsFulfilled++;
			}

			if(strengthData['imagesWithAnnotations'].length >= strengthData['images'].length){
				almostReqsFulfilled++;
			}

			if(strengthData['problemsWithSuggestions'] >= strengthData['issues']){
				almostReqsFulfilled++;
			}

			if(strengthData['compsWithRelationships'].length >= strengthData['allComponents'].length){
				almostReqsFulfilled++;	
			}

			if(almostReqsFulfilled >= 3){
				strengthResponse['appStrengthText'] = 'ALMOST...';
				strengthResponse['appStrengthClass'] = 'almost col-md-8';
			}

			//if all 6 requirements are satisfied, it may be eligible for the highest strength. 
			// next, check if there are at least 4 of the issues are from the viability categories,
			// and that all 12 viability categories have a score
			if(almostReqsFulfilled >= 6){
				// Count how many of the issues have a problem area that is a viability category
				var numberOfViabilityIssues = 0;
				_.each(strengthData['issues'], function(issue, index){
					if(issue[1].indexOf("Performability") > -1 ||
							issue[1].indexOf("Affordability") > -1 ||
							issue[1].indexOf("Featurability") > -1 ||
							issue[1].indexOf("Deliverability") > -1 ||
							issue[1].indexOf("Useability") > -1 ||
							issue[1].indexOf("Maintainability") > -1 ||
							issue[1].indexOf("Durability") > -1 ||
							issue[1].indexOf("Imageability") > -1 ||
							issue[1].indexOf("Complexity") > -1 ||
							issue[1].indexOf("Precision") > -1 ||
							issue[1].indexOf("Variability") > -1 ||
							issue[1].indexOf("Sensitivity") > -1 ||
							issue[1].indexOf("Immaturity") > -1 ||
							issue[1].indexOf("Danger") > -1 ||
							issue[1].indexOf("Skills") > -1 ){
						numberOfViabilityIssues++;
					}
				});

				if(numberOfViabilityIssues >= 4 && strengthData['viabilityScores'].length >= 15){
					strengthResponse['appStrengthText'] = 'YES!';
					strengthResponse['appStrengthClass'] = 'yes col-md-12';
				}
			}
			/*
				To get the middle level of readiness, the user must have completed
				all of the following:
				
				Two or more uploaded images 
				One or more component/annotation per uploaded image
				One or more relationship between components per component
				Four or more issues within the viability categories
				One or more suggestion per issue within the viability categories
				All viability scores 
			*/


			resolve(strengthResponse); // success
		}); //end of the then function
	});
};

var getStrengthData = function getStrengthData(ideaSeedID){
	
	return new Promise(
	function (resolve, reject) {


		var strengthDataCollected = {
			'description' : '',
			'problem'			: '',
			'name'				: '',
		
			'images'			: [],
			'issues'			: [], // currently a list of ordered pairs [problemID, problem area]
			'viabilityScores' : [],
			'imagesWithAnnotations' : [],
			'problemsWithSuggestions' : [],
			'compsWithRelationships': [],

			'allComponents' : []
		};
		IdeaSeed.findById(ideaSeedID, function(err, idea){

			if( idea.problem) {
				strengthDataCollected['problem'] = idea.problem;
			}

			if( idea.description){
				strengthDataCollected['description'] = idea.description;
			}

			if( idea.name){
				strengthDataCollected['name'] = idea.name;
			}

			if(idea.images && idea.images.length > 0){
				strengthDataCollected['images'] = _.map(idea.images, function(element, index){
					return element.id.toString();
				});
			}

			if(idea.performOne){
				strengthDataCollected['viabilityScores'].push("performOne");
			}

			if(idea.affordOne){
				strengthDataCollected['viabilityScores'].push("affordOne");
			}

			if(idea.featureOne){
				strengthDataCollected['viabilityScores'].push("featureOne");
			}

			if(idea.deliverOne){
				strengthDataCollected['viabilityScores'].push("deliverOne");
			}

			if(idea.useabilityOne){
				strengthDataCollected['viabilityScores'].push("useabilityOne");
			}

			if(idea.maintainOne){
				strengthDataCollected['viabilityScores'].push("maintainOne");
			}

			if(idea.durabilityOne){
				strengthDataCollected['viabilityScores'].push("durabilityOne");
			}

			if(idea.imageOne){
				strengthDataCollected['viabilityScores'].push("imageOne");
			}

			if(idea.complexOne){
				strengthDataCollected['viabilityScores'].push("complexOne");
			}

			if(idea.precisionOne){
				strengthDataCollected['viabilityScores'].push("precisionOne");
			}

			if(idea.variabilityOne){
				strengthDataCollected['viabilityScores'].push("variabilityOne");
			}

			if(idea.sensitivityOne){
				strengthDataCollected['viabilityScores'].push("sensitivityOne");
			}

			if(idea.immatureOne){
				strengthDataCollected['viabilityScores'].push("immatureOne");
			}

			if(idea.dangerOne){
				strengthDataCollected['viabilityScores'].push("dangerOne");
			}

			if(idea.skillsOne){
				strengthDataCollected['viabilityScores'].push("skillsOne");
			}


			IdeaProblem.find({"ideaSeed" : idea.id}, function(err, problems){
				
				if(problems && problems.length > 0){
					strengthDataCollected['issues'] = _.map(problems, function(element, index){
						return [element.id, element.problemArea];
					});
				}

				Component.find({"ideaSeed" : idea.id}, function(err, components){
					if(components && components.length > 0){
						
						//Determine whether the component is an image annotation or if it's a 
						// solution to a problem area, like a viability category
						_.each(components, function(thisComponent, index){

							//add all components to the list of all components
							strengthDataCollected['allComponents'].push(thisComponent.id);
							
							// check if the component is an image annotation
							if(thisComponent.images && thisComponent.images.length > 0){
								_.each(thisComponent.images, function(thisComponentImage, imageIndex){
									// this builds a list of the images that have at least one associated component/annotation
									if( strengthDataCollected['imagesWithAnnotations'].indexOf(thisComponentImage.id) == -1){
										strengthDataCollected['imagesWithAnnotations'].push(thisComponentImage.id);
									}
								});
							}

							//check if the component is a suggestion to a problem area, like a viability category
							if(thisComponent.problemID){
								strengthDataCollected['problemsWithSuggestions'].push(thisComponent.problemID);
							}

							//check if this component has any relationships to other components
							if(thisComponent.relatedComps && thisComponent.relatedComps.length > 0){
								strengthDataCollected['compsWithRelationships'].push(thisComponent.id);
							}
						});

					}
					resolve(strengthDataCollected); // success
				});
			});
		});
	}); //end of promise
}

exports.getApplicationStrength = getApplicationStrength;