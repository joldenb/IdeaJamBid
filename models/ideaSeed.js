var mongoose = require('mongoose');
var _ = require('underscore');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var officegen = require('officegen');
var fs = require('fs');
var path = require('path');
var IdeaReview = require('./ideaReviews');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Canvas = require('canvas'), Image = Canvas.Image;

var IdeaSeed = new Schema({
	name			: String,
	description		: String,
	problem			: String,
	characterization : String,
	inventorName		: String,
	visibility		: { type: String, default: "private" },
	images			: [ObjectId],
	firstFeature	: String,
	secondFeature	: String,
	thirdFeature	: String,

	suggestions		: [{
		suggestionID	: String, /* used in creating a variant */
		category			: String, // the column and row in the grid of points
		contributor		: String,
		problemType		: String, // can be a waste value category or component ID (toString) ** outdated

		suggestion		: String,
		hindsight		: String,
		outsight		: String,
		foresight		: String
	}],

	variants			: [{
		name				: String, /* should be a unique identifier */
		components : [ String	], /* should match a suggestionID */
		images			: [ String ] // filenames of images
	}],

	alternatives	: [{
		name					: String,
		description		: String,
		failureReason	: String,
		differsBy			: String
	}],

	industries			:[{
		name					: String
	}],

	unmetNeed				: String,

	desireableCharacteristics	: [{
		characteristic		: String
	}],

	ideaReviews		: [ObjectId],

	problemPriorities : [ ObjectId ], //order of this array is priority of problem

	performOne		: Number,
	performProblem		: String,
	performPriority		: { type: Number, default: 1 },

	affordOne		: Number,
	affordProblem		: String,
	affordPriority		: { type: Number, default: 2 },

	featureOne		: Number,
	featureProblem		: String,
	featurePriority		: { type: Number, default: 3 },

	deliverOne		: Number,
	deliverProblem		: String,
	deliverPriority		: { type: Number, default: 4 },

	useabilityOne	: Number,
	useabilityProblem	: String,
	useabilityPriority		: { type: Number, default: 5 },

	maintainOne		: Number,
	maintainProblem		: String,
	maintainPriority		: { type: Number, default: 6 },

	durabilityOne	: Number,
	durabilityProblem	: String,
	durabilityPriority		: { type: Number, default: 7 },

	imageOne		: Number,
	imageProblem		: String,
	imagePriority		: { type: Number, default: 8 },

	complexOne		: Number,
	complexProblem		: String,
	complexPriority		: { type: Number, default: 9 },

	precisionOne	: Number,
	precisionProblem	: String,
	precisionPriority		: { type: Number, default: 10 },

	variabilityOne	: Number,
	variabilityProblem	: String,
	variabilityPriority		: { type: Number, default: 11 },

	sensitivityOne	: Number,
	sensitivityProblem	: String,
	sensitivityPriority		: { type: Number, default: 12 },

	immatureOne		: Number,
	immatureProblem		: String,
	immaturePriority		: { type: Number, default: 13 },

	dangerOne		: Number,
	dangerProblem		: String,
	dangerPriority		: { type: Number, default: 14 },

	skillsOne		: Number,
	skillsProblem		: String,
	skillsPriority		: { type: Number, default: 15 }
});

IdeaSeed.statics.getWasteValueScores = function(idea){
	IdeaReview.find({}, function(err, reviews){
		// average out all the reviews
	});
		return [200, 200];
};

IdeaSeed.statics.getWasteValueCompletion = function(idea){
	
};

IdeaSeed.statics.createApplication = function(idea, account, problems, images, comps, res){

		function createWordDoc(){
					res.writeHead ( 200, {
						"Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
						'Content-disposition': 'attachment; filename=PreliminaryApplication.docx'
					});

					var docx = officegen ( 'docx' );

					docx.on ( 'finalize', function ( written ) {
						console.log ( 'Finish to create a Word file.\nTotal bytes created: ' + written + '\n' );
					});

					docx.on ( 'error', function ( err ) {
						console.log ( 'Errors: ' + err + '\n' );
					});


					var pObj = docx.createP ({ align: 'center' });
					pObj.addText ( 'IN THE UNITED STATES PATENT AND TRADEMARK OFFICE', { font_size: 14 } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText ( 'Provisional Utility Patent Application', { font_size: 14 } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText( '', { font_size : 14 } );

					//what its called and who its by
					pObj = docx.createP ({ align: 'center' });
					pObj.addText ( idea.name, { font_size: 14 } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText( account.username, { font_size : 14 } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText( '', { font_size : 14 } );

					pObj = docx.createP ({ align: 'center' });
					pObj.addText ( 'CROSS-REFERENCE TO RELATED APPLICATIONS: Not Applicable', { font_size: 14 } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText( '', { font_size : 14 } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText ( 'STATEMENT REGARDING FEDERALLY SPONSORED RESEARCH OR DEVELOPMENT: Not Applicable', { font_size: 14 } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText( '', { font_size : 14 } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText ( 'REFERENCE TO SEQUENCE LISTING, A TABLE, OR A COMPUTER PROGRAM LISTING COMPACT DISK APPENDIX: Not Applicable', { font_size: 14 } );

					docx.putPageBreak ();

					pObj = docx.createP ();
					pObj.addText( 'BACKGROUND OF THE INVENTION', { font_size : 14 } );

					// enter description which involves broad problem statement.
					pObj = docx.createP ({ align: 'center' });
					pObj.addText ( 'The present inventor has recognized \"' + idea.problem.toLowerCase() +
						'\".  Currently there are a number of solutions for \"' + idea.problem.toLowerCase() +
						'\". These solutions, however, fail to meet the needs of the'+
						' industry because of the challenges associated with ', { font_size : 14 });
					for(var i = 0;  i < problems.length; i++){
						if(i < problems.length - 1){
							pObj.addText ( problems[i].text.toLowerCase() + '\", \"', { font_size : 14 } );
						} else {
							pObj.addText ( + "and \"" + problems[i].text.toLowerCase() + '\". ', { font_size : 14 } );
						}
					}

					pObj = docx.createP ();
					pObj.addText( 'BRIEF DESCRIPTION OF FIGURES', { font_size : 14 } );

					for(i=0; i < images.length; i++){
						pObj = docx.createP ();
						pObj.addText( 'Figure 1 depicts an embodiment of the invention comprising \"', { font_size : 14 } );
						pObj.addText( images[i].filename + '\".', { font_size : 14 } );
					}

					pObj = docx.createP ();
					pObj.addText( 'BRIEF DESCRIPTION OF NUMERICAL REFERENCES IN FIGURES', { font_size : 14 } );
					for(i=0; i < comps.length; i++){
						if(comps[i].number && comps[i].text){
							pObj = docx.createP ();
							pObj.addText( comps[i].number +'. \"', { font_size : 14 } );
							pObj.addText( comps[i].text + '\" in an embodiment of the invention.', { font_size : 14 } );
						}
					}

					pObj = docx.createP ();
					pObj.addText( 'DESCRIPTION OF THE INVENTION', { font_size : 14 } );

					pObj = docx.createP ();
					pObj.addText( 'The preferred embodiment of the present invention is a \"' + idea.name + 
						'\".  \"' + idea.name + '\" is intended to \"' + idea.description + '\".  ' + 
						'Embodiments of the invention comprise some or all of the following components: ', { font_size : 14 } );
					for(i=0; i < comps.length; i++){
						if(comps[i].problemID && comps[i].descriptions.length > 0){
							pObj.addText( '(' + (i+1) +'.) ', { font_size : 14 } );
							pObj.addText( comps[i].descriptions[0].toLowerCase() + '\", \"', { font_size : 14 } );
						}
					}
					pObj.addText('.', {font_size : 14});

					for(i=0; i < comps.length; i++){
						if(comps[i].problemID && comps[i].descriptions.length > 0){
							pObj = docx.createP ();
							pObj.addText( 'An embodiment of the invention incorporates \"' +
								comps[i].descriptions[0].toLowerCase() + '\". ', { font_size : 14 } );
							pObj.addText( 'The present inventor has recognized that \"' +
								comps[i].descriptions[0].toLowerCase() + '\" addresses the problem of \"', { font_size : 14 } );
							for(j=0; j < problems.length; j++){
								if(comps[i].problemID.toString() == problems[j]['id'].toString()){
									pObj.addText( problems[j]['text'] + '\".  \"', { font_size : 14 } );
								}
							}	
							
							if(comps[i].descriptions.length > 1){
								for(j=1; j < comps[i].descriptions.length; j++){
									pObj.addText( '\"'+comps[i].descriptions[0] + '\" is described as \"', { font_size : 14 } );
									pObj.addText( comps[i].descriptions[j] + '\". ', { font_size : 14 } );
								}
							}
						}
					}

					var alreadyListed = [];
					var listedDescriptions = [];
					var otherCompName = '';
					for(i=0; i < comps.length; i++){
						if(comps[i].relatedComps.length > 0){
							for(j=0; j < comps[i].relatedComps.length; j++){
								
								//since the component relationship is listed in both components, we only list the relationship if
								// it hasn't been listed yet.
								if((alreadyListed.indexOf(comps[i].id.toString()+"-"+ comps[i].relatedComps[j].compID.toString()) == -1  &&
									alreadyListed.indexOf(comps[i].relatedComps[j].compID.toString()+"-"+ comps[i].id.toString()) == -1 ) ||
									listedDescriptions.indexOf(comps[i].relatedComps[j].relationship) == -1 ){
									
									//get the other component's name or first description
									for(k=0; k < comps.length; k++){
										if(comps[k].id.toString() == comps[i].relatedComps[j].compID.toString()){
											if(comps[k].text && comps[i].text){
												otherCompName = comps[k].text;
												pObj = docx.createP ();
												pObj.addText( 'In an embodiment of the invention, \"' + comps[i].text.toLowerCase() + '\"\"\" and \"\"', { font_size : 14 } );
												pObj.addText( otherCompName.toLowerCase() + '\" are related. \"\"', { font_size : 14 } );
												pObj.addText( comps[i].text.toLowerCase() + '\" and \"', { font_size : 14 } );
												pObj.addText( otherCompName + '\" related to one another in such embodiment by \"', { font_size : 14 } );
												pObj.addText( comps[i].relatedComps[j].relationship.toLowerCase() + '\". ', { font_size : 14 } );
											} else if(!comps[k].text && comps[i].text) {
												otherCompName = comps[k].descriptions[0];
												pObj = docx.createP ();
												pObj.addText( 'In an embodiment of the invention, \"' + comps[i].text.toLowerCase() + '\" and \"', { font_size : 14 } );
												pObj.addText( otherCompName.toLowerCase() + '\" are related. \"', { font_size : 14 } );
												pObj.addText( comps[i].text.toLowerCase() + '\" and \"', { font_size : 14 } );
												pObj.addText( otherCompName + '\" related to one another in such embodiment by \"', { font_size : 14 } );
												pObj.addText( comps[i].relatedComps[j].relationship.toLowerCase() + '\". ', { font_size : 14 } );
											} else if(comps[k].text && !comps[i].text) {
												otherCompName = comps[k].text;
												pObj = docx.createP ();
												pObj.addText( 'In an embodiment of the invention, \"' + comps[i].descriptions[0].toLowerCase() + '\" and \"', { font_size : 14 } );
												pObj.addText( otherCompName.toLowerCase() + '\" are related. \"', { font_size : 14 } );
												pObj.addText( comps[i].descriptions[0].toLowerCase() + '\" and \"', { font_size : 14 } );
												pObj.addText( otherCompName + '\" related to one another in such embodiment by \"', { font_size : 14 } );
												pObj.addText( comps[i].relatedComps[j].relationship.toLowerCase() + '\". ', { font_size : 14 } );
											} else if(!comps[k].text && !comps[i].text) {
												otherCompName = comps[k].descriptions[0];
												pObj = docx.createP ();
												pObj.addText( 'In an embodiment of the invention, \"' + comps[i].descriptions[0].toLowerCase() + '\" and \"', { font_size : 14 } );
												pObj.addText( otherCompName.toLowerCase() + '\" are related. \"', { font_size : 14 } );
												pObj.addText( comps[i].descriptions[0].toLowerCase() + '\" and \"', { font_size : 14 } );
												pObj.addText( otherCompName + '\" related to one another in such embodiment by \"', { font_size : 14 } );
												pObj.addText( comps[i].relatedComps[j].relationship.toLowerCase() + '\". ', { font_size : 14 } );
											}
										}
									}

									alreadyListed.push(comps[i].id.toString()+"-"+ comps[i].relatedComps[j].compID.toString());
									listedDescriptions.push(comps[i].relatedComps[j].relationship);
									otherCompName = '';

								}
							}
						}


					}

					pObj = docx.createP ();
					pObj.addText( 'In the foregoing specification, specific embodiments have been described. '+
						'However, one of ordinary skill in the art appreciates that various modifications and changes '+
						'can be made without departing from the scope of the invention as set forth in the claims below. '+
						'Accordingly, the specification and figures are to be regarded in an illustrative rather than a '+
						'restrictive sense, and all such modifications are intended to be included within the scope of present '+
						'teachings.', { font_size : 14 } );
					pObj = docx.createP ();
					pObj.addText( 'The benefits, advantages, solutions to problems, and any element(s) that may cause any '+
						'benefit, advantage, or solution to occur or become more pronounced are not to be construed as a critical, '+
						'required, or essential features or elements of any or all the claims. The invention is defined solely '+
						'by the appended claims including any amendments made during the pendency of this application and all '+
						'equivalents of those claims as issued.', { font_size : 14 } );
					pObj = docx.createP ();
					pObj.addText( 'Moreover in this document, relational terms such as first and second, top and bottom, and '+
						'the like may be used solely to distinguish one entity or action from another entity or action without '+
						'necessarily requiring or implying any actual such relationship or order between such entities or actions. '+
						'The terms "comprises," "comprising," "has", "having," "includes", "including," "contains", "containing" or '+
						'any other variation thereof, are intended to cover a non-exclusive inclusion, such that a process, method, '+
						'article, or apparatus that comprises, has, includes, contains a list of elements does not include only those '+
						'elements but may include other elements not expressly listed or inherent to such process, method, article, '+
						'or apparatus. An element proceeded by "comprises ... a", "has ... a", "includes ... a", "contains ... a" '+
						'does not, without more constraints, preclude the existence of additional identical elements in the process, '+
						'method, article, or apparatus that comprises, has, includes, contains the element. The terms "a" and "an" are '+
						'defined as one or more unless explicitly stated otherwise herein. The terms "substantially", "essentially", '+
						'"approximately", "about" or any other version thereof, are defined as being close to as understood by one of '+
						'ordinary skill in the art. The terms "coupled" and “linked” as used herein is defined as connected, although '+
						'not necessarily directly and not necessarily mechanically. A device or structure that is "configured" in a '+
						'certain way is configured in at least that way, but may also be configured in ways that are not listed. Also, '+
						'the sequence of steps in a flow diagram or elements in the claims, even when preceded by a letter does not '+
						'imply or require that sequence.', { font_size : 14 } );


					docx.putPageBreak ();
					pObj = docx.createP ();
					pObj.addText( 'CLIAMS', { font_size : 14 } );
					pObj = docx.createP ();
					pObj.addText( 'I claim:', { font_size : 14 } );
					pObj = docx.createP ();
					pObj.addText( '1. The invention described herein.', { font_size : 14 } );



					docx.putPageBreak ();
					pObj = docx.createP ();
					pObj.addText( 'Legend of Components', { font_size : 14 } );
					for(i=0; i < comps.length; i++){
						if(comps[i].number && comps[i].text){
							pObj = docx.createP ();
							pObj.addText( comps[i].number +'. ', { font_size : 14 } );
							pObj.addText( comps[i].text, { font_size : 14 } );
						} else if(comps[i].number && comps[i].text){
							pObj = docx.createP ();
							pObj.addText( comps[i].number +'. ', { font_size : 14 } );
							pObj.addText( comps[i].descriptions[0], { font_size : 14 } );
						}
					}

					for(i=0;i<images.length; i++){
						docx.putPageBreak ();
						pObj = docx.createP ();
						pObj.addText( 'Figure ' + (i+1), { font_size : 14 } );
						pObj.addImage(__dirname + '/figure-' + (i+1) +'.png', { cx: 600, cy: 400 } ) ;
					}

					docx.generate ( res, {
				    'finalize': function ( written ) {
								for(i=0;i<images.length; i++){
									fs.unlink(__dirname + '/figure-' + (i+1) +'.png');
								}

				        console.log ( 'Finish to create a preliminary application.\nTotal bytes created: ' + written + '\n' );
				    },
				    'error': function ( err ) {
				        console.log ( err );
				    }
					} );
		}			

		function renderImage(number) {
			var outStreams = [];
			var canvasStreams = [];

			canvas = new Canvas(1000, 700);
			ctx = canvas.getContext('2d');

			ctx.fillStyle="#FFFFFF";
			ctx.fillRect(0,0,1000,700);

			img = new Image();
			img.src = "data:" + images[number].imageMimetype + ";base64," + images[number].image.toString('base64');
			ctx.drawImage(img, 200, 150, 600, 400);

			var componentImageIds = [], imageIndex;
			for(var j=0; j < comps.length; j++){
				componentImageIds = _.map(comps[j].images, function(image){
					return image['imageID'].toString();
				});

				if(componentImageIds.indexOf(images[number].id) > -1  && 
						comps[j]['number'] ){
					
					imageIndex = componentImageIds.indexOf(images[number].id);

					var firstX = parseInt(comps[j].images[imageIndex].firstX);
					var firstY = parseInt(comps[j].images[imageIndex].firstY);
					var secondX = parseInt(comps[j].images[imageIndex].secondX);
					var secondY = parseInt(comps[j].images[imageIndex].secondY);
					ctx.beginPath();
          ctx.moveTo(firstX, firstY);
          ctx.lineTo(secondX, secondY);
          ctx.stroke();

          var textCoordX, textCoordY;
          ctx.fillStyle = "black";
          ctx.font="20px Helvetica";
          if(secondX > 800){
            textCoordX = (secondX*1 + 20);
            textCoordY = secondY;
          } else if(secondX < 200){
            textCoordX = secondX - 20;
            textCoordY = secondY;
          } else if(secondY > 550){
            textCoordX = secondX;
            textCoordY = (secondY*1 + 20);
          } else if(secondY < 150){
            textCoordX = secondX;
            textCoordY = secondY - 20;
          }
          ctx.fillText(comps[j]['number']+".",textCoordX,textCoordY);
				}
			}
			out = fs.createWriteStream(__dirname + '/figure-' + (number+1) +'.png');
			canvasStream = canvas.pngStream();

			canvasStream.on('data', function(chunk){
				out.write(chunk);
			});

			canvasStream.on('end', function(){
				console.log('saved png');
				if(number < images.length - 1){
					number++;
					renderImage(number);
				// once all the images are created, create the rest of the word document
				} else if (number == images.length - 1 ){
					createWordDoc();

				}
			});
		}

		if(images.length > 0){
			var number = 0;
			renderImage(number);
		} else {
			createWordDoc();
		}

};

IdeaSeed.statics.getListOfInventorProblems = function(idea) {
	var problems = [];
	if(idea["performProblem"]){
		problems.push(["Performance", idea["performProblem"], idea["performPriority"], idea["inventorName"] ]);
	}
	if(idea["affordProblem"]){
		problems.push(["Affordability", idea["affordProblem"], idea["affordPriority"], idea["inventorName"] ]);
	}
	if(idea["featureProblem"]){
		problems.push(["Featurability", idea["featureProblem"], idea["featurePriority"], idea["inventorName"] ]);
	}
	if(idea["deliverProblem"]){
		problems.push(["Deliverability", idea["deliverProblem"], idea["deliverPriority"], idea["inventorName"] ]);
	}
	if(idea["useabilityProblem"]){
		problems.push(["Useability", idea["useabilityProblem"], idea["useabilityPriority"], idea["inventorName"] ]);
	}
	if(idea["maintainProblem"]){
		problems.push(["Maintainability", idea["maintainProblem"], idea["maintainPriority"], idea["inventorName"] ]);
	}
	if(idea["durabilityProblem"]){
		problems.push(["Durability", idea["durabilityProblem"], idea["durabilityPriority"], idea["inventorName"] ]);
	}
	if(idea["imageProblem"]){
		problems.push(["Imageability", idea["imageProblem"], idea["imagePriority"], idea["inventorName"] ]);
	}
	if(idea["complexProblem"]){
		problems.push(["Complexity", idea["complexProblem"], idea["complexPriority"], idea["inventorName"] ]);
	}
	if(idea["precisionProblem"]){
		problems.push(["Precision", idea["precisionProblem"], idea["precisionPriority"], idea["inventorName"] ]);
	}
	if(idea["variabilityProblem"]){
		problems.push(["Variability", idea["variabilityProblem"], idea["variabilityPriority"], idea["inventorName"] ]);
	}
	if(idea["sensitivityProblem"]){
		problems.push(["Sensitivity", idea["sensitivityProblem"], idea["sensitivityPriority"], idea["inventorName"] ]);
	}
	if(idea["immatureProblem"]){
		problems.push(["Immaturity", idea["immatureProblem"], idea["immaturePriority"], idea["inventorName"] ]);
	}
	if(idea["dangerProblem"]){
		problems.push(["Danger", idea["dangerProblem"], idea["dangerPriority"], idea["inventorName"] ]);
	}
	if(idea["skillsProblem"]){
		problems.push(["Skills", idea["skillsProblem"], idea["skillsPriority"], idea["inventorName"] ]);
	}
	return problems;
};


/*
	This method will take an idea and a problem and return an 
	object with keys that are suggestion types (e.g. reduce-parts)
	and values which are arrays of suggestions for that idea with that
	particular suggestion type.
*/
IdeaSeed.statics.getCategorizedSuggestions = function(idea, problem, contributor){
	var suggestionList = {},
		problemSuggestions = [];

	_.each(idea["suggestions"], function(element, index, list){
		if(problem){
			if(element._doc["problemType"] == problem && element._doc["contributor"] == contributor){
				problemSuggestions.push(element);
			}
		} else {
			problemSuggestions.push(element);
		}
	});

	_.each(problemSuggestions, function(element, index, list){
		if(suggestionList.hasOwnProperty(element["category"])){
			suggestionList[element["category"]].push(element._doc);
		} else {
			suggestionList[element["category"]] = [element._doc];
		}
	});

	return suggestionList;
};

/*
	This function is designed to take as an argument the output of the 
	method getCategorizedSuggestions. It's a pretty particular structure.
*/

IdeaSeed.statics.getCategoryPointValues = function(categorizedObject){
	var catPoints = {
		"elim-func" : "+50",
		"elim-parts" : "+50",
		"elim-life" : "+50",
		"elim-mat" : "+50",
		"elim-people" : "+50",

		"reduce-func" : "+50",
		"reduce-parts" : "+50",
		"reduce-life" : "+50",
		"reduce-mat" : "+50",
		"reduce-people" : "+50",

		"sub-func" : "+50",
		"sub-parts" : "+50",
		"sub-life" : "+50",
		"sub-mat" : "+50",
		"sub-people" : "+50",

		"sep-func" : "+50",
		"sep-parts" : "+50",
		"sep-life" : "+50",
		"sep-mat" : "+50",
		"sep-people" : "+50",

		"int-func" : "+50",
		"int-parts" : "+50",
		"int-life" : "+50",
		"int-mat" : "+50",
		"int-people" : "+50",

		"reuse-func" : "+50",
		"reuse-parts" : "+50",
		"reuse-life" : "+50",
		"reuse-mat" : "+50",
		"reuse-people" : "+50",

		"stand-func" : "+50",
		"stand-parts" : "+50",
		"stand-life" : "+50",
		"stand-mat" : "+50",
		"stand-people" : "+50",

		"add-func" : "+50",
		"add-parts" : "+50",
		"add-life" : "+50",
		"add-mat" : "+50",
		"add-people" : "+50"
	};

	for(var category in categorizedObject){
		var points = 50/(Math.pow(2, categorizedObject[category].length));
		points = Math.round(points);
		catPoints[category] = "+" + points;
	}

	return catPoints;
};

IdeaSeed.statics.getCategoryDisplayNames = function(categorizedObject){
	var returnCategories = {};
	for(var cat in categorizedObject){
		switch ( cat ) {
			case "elim-func" :
				returnCategories["Eliminate Functions"] = categorizedObject["elim-func"];
				break;
			case "elim-parts" :
				returnCategories["Eliminate Parts"] = categorizedObject["elim-parts"];
				break;
			case "elim-life" :
				returnCategories["Eliminate Life-Cycle Processes"] = categorizedObject["elim-life"];
				break;
			case "elim-mat" :
				returnCategories["Eliminate Materials"] = categorizedObject["elim-mat"];
				break;
			case "elim-people" :
				returnCategories["Eliminate People"] = categorizedObject["elim-people"];
				break;

			case "reduce-func" :
				returnCategories["Reduce Functions"] = categorizedObject["reduce-func"];
				break;
			case "reduce-parts" :
				returnCategories["Reduce Parts"] = categorizedObject["reduce-parts"];
				break;
			case "reduce-life" :
				returnCategories["Reduce Life-Cycle Processes"] = categorizedObject["reduce-life"];
				break;
			case "reduce-mat" :
				returnCategories["Reduce Materials"] = categorizedObject["reduce-mat"];
				break;
			case "reduce-people" :
				returnCategories["Reduce People"] = categorizedObject["reduce-people"];
				break;

			case "sub-func" :
				returnCategories["Substitute Functions"] = categorizedObject["sub-func"];
				break;
			case "sub-parts" :
				returnCategories["Substitute Parts"] = categorizedObject["sub-parts"];
				break;
			case "sub-life" :
				returnCategories["Substitute Life-Cycle Processes"] = categorizedObject["sub-life"];
				break;
			case "sub-mat" :
				returnCategories["Substitute Materials"] = categorizedObject["sub-mat"];
				break;
			case "sub-people" :
				returnCategories["Substitute People"] = categorizedObject["sub-people"];
				break;


			case "sep-func" :
				returnCategories["Separate Functions"] = categorizedObject["sep-func"];
				break;
			case "sep-parts" :
				returnCategories["Separate Parts"] = categorizedObject["sep-parts"];
				break;
			case "sep-life" :
				returnCategories["Separate Life-Cycle Processes"] = categorizedObject["sep-life"];
				break;
			case "sep-mat" :
				returnCategories["Separate Materials"] = categorizedObject["sep-mat"];
				break;
			case "sep-people" :
				returnCategories["Separate People"] = categorizedObject["sep-people"];
				break;


			case "int-func" :
				returnCategories["Integrate Functions"] = categorizedObject["int-func"];
				break;
			case "int-parts" :
				returnCategories["Integrate Parts"] = categorizedObject["int-parts"];
				break;
			case "int-life" :
				returnCategories["Integrate Life-Cycle Processes"] = categorizedObject["int-life"];
				break;
			case "int-mat" :
				returnCategories["Integrate Materials"] = categorizedObject["int-mat"];
				break;
			case "int-people" :
				returnCategories["Integrate People"] = categorizedObject["int-people"];
				break;

			case "reuse-func" :
				returnCategories["Re-Use Functions"] = categorizedObject["reuse-func"];
				break;
			case "reuse-parts" :
				returnCategories["Re-Use Parts"] = categorizedObject["reuse-parts"];
				break;
			case "reuse-life" :
				returnCategories["Re-Use Life-Cycle Processes"] = categorizedObject["reuse-life"];
				break;
			case "reuse-mat" :
				returnCategories["Re-Use Materials"] = categorizedObject["reuse-mat"];
				break;
			case "reuse-people" :
				returnCategories["Re-Use People"] = categorizedObject["reuse-people"];
				break;


			case "stand-func" :
				returnCategories["Standardize Functions"] = categorizedObject["stand-func"];
				break;
			case "stand-parts" :
				returnCategories["Standardize Parts"] = categorizedObject["stand-parts"];
				break;
			case "stand-life" :
				returnCategories["Standardize Life-Cycle Processes"] = categorizedObject["stand-life"];
				break;
			case "stand-mat" :
				returnCategories["Standardize Materials"] = categorizedObject["stand-mat"];
				break;
			case "stand-people" :
				returnCategories["Standardize People"] = categorizedObject["stand-people"];
				break;

			case "add-func" :
				returnCategories["Add Functions"] = categorizedObject["add-func"];
				break;
			case "add-parts" :
				returnCategories["Add Parts"] = categorizedObject["add-parts"];
				break;
			case "add-life" :
				returnCategories["Add Life-Cycle Processes"] = categorizedObject["add-life"];
				break;
			case "add-mat" :
				returnCategories["Add Materials"] = categorizedObject["add-mat"];
				break;
			case "add-people" :
				returnCategories["Add People"] = categorizedObject["add-people"];
				break;
			case "other" :
				returnCategories["Other"] = categorizedObject["other"];
				break;

		}
	}
	return returnCategories;
};

IdeaSeed.statics.generateSuggID = function(suggestionText){
	var newID = suggestionText.substr(0, suggestionText.indexOf(" "));
	newID = newID + Date.now().toString();
	return newID;
};

IdeaSeed.statics.generateVariantName = function(ideaName){
	var newName = ideaName.replace(/\s/g, '');
	newName = newName + Date.now().toString();
	return newName;
};

IdeaSeed.statics.getTopThreeProblems = function(idea){
	var topProblems = [_.invert(idea)[1], _.invert(idea)[2], _.invert(idea)[3]];
	topProblems = _.map(topProblems, function(problem){
		return [problem.slice(0, -8) + "Problem"];
	});
	return _.map(topProblems, function(problem){ return [problem, idea[problem]]; });
};

module.exports = mongoose.model('IdeaSeed', IdeaSeed);