var mongoose = require('mongoose');
var _ = require('underscore');
var Schema = mongoose.Schema;
var aws = require('aws-sdk');
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
	applicationReceipt : ObjectId,
	firstFeature	: String,
	secondFeature	: String,
	thirdFeature	: String,
  aptitudes       : [ObjectId],

  collaborators : [String], //this will be a username

	variants			: [{
		name				: String, /* should be a unique identifier */
		components : [ String	], /* should match a suggestionID */
		images			: [ String ], // filenames of images
		variantApplication : ObjectId, //this should be a pdf store in amazon s3
		variantReceipt : ObjectId, // once the variant application is built and filed.
		contributorsSignedOff : Schema.Types.Mixed, //this will be a list of all the contributors to the variant with a
		//true or false to indicate if they've signed off for the variant to be filed.  E.g. {"tom" : unsent, pending, or approved}
		// it will get populated with a bunch of false's when when the variant is created, then switched to 
		// trues one by one as people sign off.
		contributorContracts : Schema.Types.Mixed
	}],

	ideaReviews		: [ObjectId],

	problemPriorities : [ ObjectId ], //order of this array is priority of problem

	performOne		: Number,
	performPriority		: { type: Number, default: 1 },

	affordOne		: Number,
	affordPriority		: { type: Number, default: 2 },

	featureOne		: Number,
	featurePriority		: { type: Number, default: 3 },

	deliverOne		: Number,
	deliverPriority		: { type: Number, default: 4 },

	useabilityOne	: Number,
	useabilityPriority		: { type: Number, default: 5 },

	maintainOne		: Number,
	maintainPriority		: { type: Number, default: 6 },

	durabilityOne	: Number,
	durabilityPriority		: { type: Number, default: 7 },

	imageOne		: Number,
	imagePriority		: { type: Number, default: 8 },

	complexOne		: Number,
	complexPriority		: { type: Number, default: 9 },

	precisionOne	: Number,
	precisionPriority		: { type: Number, default: 10 },

	variabilityOne	: Number,
	variabilityPriority		: { type: Number, default: 11 },

	sensitivityOne	: Number,
	sensitivityPriority		: { type: Number, default: 12 },

	immatureOne		: Number,
	immaturePriority		: { type: Number, default: 13 },

	dangerOne		: Number,
	dangerPriority		: { type: Number, default: 14 },

	skillsOne		: Number,
	skillsPriority		: { type: Number, default: 15 }
}, { autoIndex: false });

IdeaSeed.statics.getWasteValueScores = function(idea){
	IdeaReview.find({}, function(err, reviews){
		// average out all the reviews
	});
		return [200, 200];
};

IdeaSeed.statics.getWasteValueCompletion = function(idea){
	
};

IdeaSeed.statics.createVariantContract = function(signerName){

	return new Promise(
		function (resolve, reject) {


	var docx = officegen ( {type: 'docx', font_face :'Times New Roman'} );


	var pObj = docx.createP ({ align: 'center' });
	pObj.addText ( 'Assignment Agreement', { font_size: 18, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'This Assignment Agreement made this ____ day of __________, 20___ by Party A (“Creator”)'+
		' [address] and Party B [C/D/etc.] [addresses] (“Contributor(s)”) (collectively the “Parties”) hereby '+
		'enter this agreement regarding an assignment of the Invention (“Assignment Agreement”)', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'WhereAS Creator has invented a [description of invention], and Contributors have '+
		'contributed to the invention. ', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'NOW THEREFORE, in consideration of the representations and covenants contained herein, '+
		'the Parties agree as follows: ', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });

	pObj.addText ( 'Definitions', { font_size: 18, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '“Contributor” means any person or party who contributed any information that was selected by '+
		'“Creator” to include into an Invention. ', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '“Creator” means any person or party who provided an Invention to Contributors.', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '“Funding Event” means monies received by a party related to the Invention through a '+
		'Funding Round.', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '“Funding Round” means monies received by a party from third-party investors, including '+
		'monies received from a crowd funding campaign, seed round investment, series investment, angel investment, '+
		'or any other funds received by a party.  A Funding Round does not include any investment made by a party'+
		' by itself or through the contribution of its officers, directors, board members, or employees. ',
		{ font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '“Invention” means any invention, idea, improvement or discovery, whether or not patentable'+
		' that has arisen through, conceived either solely or jointly with others or otherwise related to the use'+
		' of the website ideajam.io.', { font_size: 14, font_face: 'Times New Roman' } );

	var pObj = docx.createP ({ });
	pObj.addText ( 'Provisions', { font_size: 18, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '1.  Assignment.  Contributor(s) agree to assign all rights in the Invention to Creator '+
		'[do we want anything more than patent rights?  Should this be all IP?]. ', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '2. Payment.  In consideration of for an assignment of patent rights, [Creator] shall pay '+
		'Contributor(s) 10% (ten percent) of any funds received by [Creator] during a Funding Event.  If there '+
		'are multiple Contributors, the 10% shall be divided equally between each Contributor.', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '3.  Duty to Execute Assignment.  [Contributor] and [Creator] agree to execute and record an '+
		'assignment with the United States Patent and Trademark Office (“USPTO”) within three months of the filing '+
		'of a patent application directed to the Invention, a form of which is attached as Exhibit A to this '+
		'Assignment Agreement.  Contributor further agrees that it shall: (a) execute all documents requested for '+
		'formally confirming in Creator the entire right, title and interest in and to the Invention; and (b) '+
		'execute any and all documents requested by Creator for filing and prosecuting patent applications that '+
		'Creator may desire covering the Invention.', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '4.  Opportunity for Review.  The Parties agree that they have had full and complete '+
		'opportunity to consult with counsel of his or her choosing concerning the terms of this Agreement.',
		{ font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '5. Validity and Enforceability.  If any provision of this Agreement is held to be '+
		'unenforceable, invalid, or illegal by any court of competent jurisdiction, such unenforceable, invalid, '+
		'or illegal provisions(s) shall be stricken and shall not affect the enforceability of the remainder of '+
		'this Agreement.', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '6. Signatures.  This Agreement may be executed in counterparts or by electronic signature, '+
		'facsimile, photocopy, email, PDF, or other electronic means, which, when taken together, shall constitute '+
		'the entire original agreement of the Parties.', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });

	pObj.addText ( 'AGREED:', { font_size: 18, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'By: ____________________________________			By: ______________________________', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '[Creator]																			[Contributor]', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '____________________________________				  ______________________________', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Printed Name																	Printed Name', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '____________________________________					______________________________', { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Title    																			Title', { font_size: 14, font_face: 'Times New Roman' } );

	docx.putPageBreak ();	

	var pObj = docx.createP ({ align: 'center' });
	pObj.addText ( 'Exhibit A: Assignment', { font_size: 18, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ align: 'center' });
	pObj.addText ( 'ASSIGNMENT', { font_size: 18, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'WHEREAS, I, [Contributor], having an address of [Insert] have invented a certain new and useful invention entitled “[Insert]” for which an application for Letters Patent of the United States has been prepared for filing, said application being identified as Application No. [insert].',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'NOW THEREFORE, be it known that I, the said inventor, for and in consideration of certain good and valuable consideration, the sufficiency and receipt of which is hereby acknowledged, at the request of the assignee do sell, assign and transfer unto said assignee, [Insert Assignee], a [Insert State and Entity Type] having a place of business at [Insert Address], its successors, legal representatives and assigns, the aforesaid application and the invention described therein for the territory of the United States of America and all regular, continuation, divisional, continuation-in-part and reissue applications, all patent applications in foreign countries, all applications pursuant to the Patent Cooperation Treaty and all applications for extension filed or to be filed for the invention, and all Letters Patent, Invention Registrations, Utility Models, Extensions or Reissues and other patent rights, obtained for the invention in the United States or any other country; I also assign any right, title or interest in and to the said invention which has not already been transferred to the assignee, I warrant that I have made no assignment of the invention, application or patent therefor to a party other than [Insert Asignee], and I am under no obligation to make any assignment of the invention, application, or patent therefor to any other party; and I further agree to cooperate with the assignee hereunder in the obtaining and sustaining of any and all such Letters Patent and in confirming assignee\'s exclusive ownership of the invention, but at the expense of said assignee.',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'The Commissioner of Patents is hereby authorized and requested to issue the Letters Patent solely in accordance with the terms of this Assignment, to [Insert Assignee], its successors, legal representatives and assigns, as the assignee of the entire right, title and interest therein.',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'IN WITNESS WHEREOF, the party hereto has executed this Assignment as of the date indicated hereunder.',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'IN WITNESS WHEREOF, the party hereto has executed this Assignment as of the date indicated hereunder.',  { font_size: 14, font_face: 'Times New Roman' } );
	
	var pObj = docx.createP ({ });
	pObj.addText ( 'Date:______________________',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Assignor:												  			Accepted by ',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( ' 																				Assignee: ',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'By: _______________________		  	By: ______________________	',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Name:  ____________________			Name:____________________	',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Title:_____________________',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'STATE OF ___________________)		)SS.',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'COUNTY OF_________________)',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Before me, a Notary Public in and for said County and State, personally appeared________________________, known to me to be the person whose name is subscribed to the foregoing instrument, and acknowledged to me that he executed the same for the purposes and considerations therein expressed.',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Given under my hand	and seal of this office this __________ day of _____________, 2016',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '___________________________________',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Notary Public',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'My Commission Expires:______________ ',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Title:_____________________ ',  { font_size: 14, font_face: 'Times New Roman' } );

	docx.putPageBreak ();	

	var pObj = docx.createP ({ });
	pObj.addText ( 'STATE OF ___________________)',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '	                          )SS.	',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'COUNTY OF_________________)',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Before me, a Notary Public in and for said County and State, personally appeared________________________, known to me to be the person whose name is subscribed to the foregoing instrument, and acknowledged to me that he executed the same for the purposes and considerations therein expressed'
		,  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Given under my hand	and seal of this office this __________ day of _____________, 2016',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Before me, a Notary Public in and for said County and State, personally appeared________________________, known to me to be the person whose name is subscribed to the foregoing instrument, and acknowledged to me that he executed the same for the purposes and considerations therein expressed.',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Given under my hand	and seal of this office this __________ day of _____________, 2016',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( '___________________________________',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'Notary Public',  { font_size: 14, font_face: 'Times New Roman' } );
	var pObj = docx.createP ({ });
	pObj.addText ( 'My Commission Expires:______________ ',  { font_size: 14, font_face: 'Times New Roman' } );

	var contractFilename = __dirname + '/../tmp/contract-' + signerName +Date.now()+'.docx';
	var out = fs.createWriteStream ( contractFilename );
	docx.generate ( out, {
	  'finalize': function ( written ) {
	    console.log ( 'Finish to create a PowerPoint file.\nTotal bytes created: ' + written + '\n' );
			var body = fs.createReadStream( contractFilename );
		  var s3 = new aws.S3({
		      accessKeyId : process.env.accessKeyId,
		      secretAccessKey : process.env.secretAccessKey
		  });
		  var s3Params = {
		    Body : body,
		    Bucket: 'qonspire',
		    Key: 'contract-' + signerName +Date.now()+'.docx',
		    Expires: 60,
		    ContentType: "docx",
		    ACL: 'public-read'
		  };
			s3.upload(s3Params).
			  on('httpUploadProgress', function(evt) { console.log(evt); }).
			  send(function(err, data) {
			  	fs.unlink( contractFilename );
			  	console.log(err, data)
			  	resolve({
			  		"location":data['Location'], 
			  		"filename" : 'contract-' + signerName +Date.now()+'.docx'
			  	});
			  });
	  },
	  'error': function ( err ) {
	    console.log ( err );
	    resolve({});
	  }
	});
	});
};


IdeaSeed.statics.createApplication = function(idea, account, problems, images, comps, res){

		function createWordDoc(){
					res.writeHead ( 200, {
						"Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
						'Content-disposition': 'attachment; filename=PreliminaryApplication.docx'
					});

					var docx = officegen ( {type: 'docx', font_face :'Times New Roman'} );

					docx.on ( 'finalize', function ( written ) {
						console.log ( 'Finish to create a Word file.\nTotal bytes created: ' + written + '\n' );
					});

					docx.on ( 'error', function ( err ) {
						console.log ( 'Errors: ' + err + '\n' );
					});


					var pObj = docx.createP ({ align: 'center' });
					pObj.addText ( 'IN THE UNITED STATES PATENT AND TRADEMARK OFFICE', { font_size: 14, font_face: 'Times New Roman' } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText ( 'Provisional Utility Patent Application', { font_size: 14, font_face: 'Times New Roman' } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText( '', { font_size: 14, font_face: 'Times New Roman' } );

					//what its called and who its by
					pObj = docx.createP ({ align: 'center' });
					pObj.addText ( idea.name.charAt(0).toUpperCase() + idea.name.slice(1), { font_size: 14, font_face: 'Times New Roman' } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText( account.nickname, { font_size: 14, font_face: 'Times New Roman', font_face: 'Times New Roman' } );
					pObj = docx.createP ({ align: 'center' });
					pObj.addText( '', { font_size: 14, font_face: 'Times New Roman' } );

					docx.putPageBreak ();

					pObj = docx.createP ();
					pObj.addText( 'BACKGROUND OF THE INVENTION', { font_size: 14, font_face: 'Times New Roman' } );

					// enter description which involves broad problem statement.
					pObj = docx.createP ();
					pObj.addText ( 'The present inventor has recognized the problem of ' + idea.problem.toLowerCase() +
						'.  Other solutions for the problem of ' + idea.problem.toLowerCase() + 
						' may exist in the prior art.' +
						'. These solutions, however, have failed to meet one or more unsolved needs recognized by the inventor'+
						' because of still-remaining challenges, including ', { font_size: 14, font_face: 'Times New Roman' });
					for(var i = 0;  i < problems.length; i++){
						if(i < problems.length - 1){
							pObj.addText ( problems[i].text.toLowerCase() + ', ', { font_size: 14, font_face: 'Times New Roman' } );
						} else {
							if(problems.length > 1){
								pObj.addText ("and ", { font_size: 14, font_face: 'Times New Roman' });
							}
							pObj.addText (problems[i].text.toLowerCase() + '. ', { font_size: 14, font_face: 'Times New Roman' } );
						}
					}

					pObj = docx.createP ();
					pObj.addText( 'BRIEF DESCRIPTION OF FIGURES', { font_size: 14, font_face: 'Times New Roman' } );

					for(i=0; i < images.length; i++){
						pObj = docx.createP ();
						if(images[i].title){
							pObj.addText( images[i].title + " depicts an embodiment of the invention.", { font_size: 14, font_face: 'Times New Roman' } );
						} else {
							pObj.addText( 'Figure ' + [i + 1] + ' depicts an embodiment of the invention.', { font_size: 14, font_face: 'Times New Roman' } );
						}
					}

					pObj = docx.createP ();
					pObj.addText( 'BRIEF DESCRIPTION OF NUMERICAL REFERENCES IN FIGURES', { font_size: 14, font_face: 'Times New Roman' } );
					comps = _.sortBy(comps, 'number');
					for(i=0; i < comps.length; i++){
						if(comps[i].number && comps[i].text){
							pObj = docx.createP ();
							pObj.addText( comps[i].number +'. ', { font_size: 14, font_face: 'Times New Roman' } );
							pObj.addText( comps[i].text.charAt(0).toUpperCase() + comps[i].text.slice(1) + ' in an embodiment of the invention.', { font_size: 14, font_face: 'Times New Roman' } );
						}
					}


					docx.putPageBreak ();
					pObj = docx.createP ();
					pObj.addText( 'LEGEND OF COMPONENTS', { font_size: 14, font_face: 'Times New Roman' } );
					for(i=0; i < comps.length; i++){
						if(comps[i].number && comps[i].text){
							pObj = docx.createP ();
							pObj.addText( comps[i].number +'. ', { font_size: 14, font_face: 'Times New Roman' } );
							pObj.addText( comps[i].text, { font_size: 14, font_face: 'Times New Roman' } );
						} else if(comps[i].number && comps[i].text){
							pObj = docx.createP ();
							pObj.addText( comps[i].number +'. ', { font_size: 14, font_face: 'Times New Roman' } );
							pObj.addText( comps[i].descriptions[0], { font_size: 14, font_face: 'Times New Roman' } );
						}
					}


					///////////////////////////////////////////////////////////////
					// This is the component section
					///////////////////////////////////////////////////////////////
					pObj = docx.createP ();
					pObj.addText( 'DESCRIPTION OF THE INVENTION', { font_size: 14, font_face: 'Times New Roman' } );

					pObj = docx.createP ();
					pObj.addText( 'The preferred embodiment of the present invention is described as a ' + idea.name + 
						'.  Generally, the inventor intends for the ' + idea.name + ' to function by ' + idea.description + '.  ' + 
						'In varying embodiments, the invention may incorporate any subset of, or all of, the following components: ', { font_size: 14, font_face: 'Times New Roman' } );
					for(i=0; i < comps.length; i++){
						if(comps[i].text || comps[i].descriptions.length > 0){
							pObj.addText( '(' + (i+1) +'.) ', { font_size: 14, font_face: 'Times New Roman' } );
							if(comps[i].text){
								pObj.addText( comps[i].text.toLowerCase() , { font_size: 14, font_face: 'Times New Roman' } );
							} else {
								pObj.addText( comps[i].descriptions[0].toLowerCase() , { font_size: 14, font_face: 'Times New Roman' } );
							}
						}
						if(i != (comps.length-1) ) {
							pObj.addText(', ', { font_size: 14, font_face: 'Times New Roman' } );
						}
					}
					pObj.addText('.', {font_size: 14, font_face: 'Times New Roman'});



					//Build the order of paragraphs correctly.  A component should be followed by all it's sub-components.
					var correctCompOrder = [];
					var isComponentAParent;
					var listOfSubComponents = [];
					var relatedCompIDs = [];
					//First we'll add all the parents and their sub components, then we'll add anything that we didn't include yet.	
					_.each(comps, function(oneComponent, compIndex){
						//if this component is a sub component of another, we dont need to add it, because it
						//will be included under another 
						listOfSubComponents = [];
						relatedCompIDs = [];
						isComponentAParent = false;
						if(oneComponent.relatedComps && oneComponent.relatedComps.length > 0){
							_.each(oneComponent.relatedComps, function(eachRelationship, relationIndex){
								if(eachRelationship['subComponent'] && eachRelationship['subComponent'] == "parent"){
									isComponentAParent = true;
									listOfSubComponents.push(eachRelationship);
								}
							})
						}
						if( isComponentAParent ){
							
							//put the parent in the correct component order array
							correctCompOrder.push(oneComponent);

							//put the sub components of the component right after the parent
							relatedCompIDs = _.map(listOfSubComponents, function(item, theIndex){
								if(item['compID']){
									return item['compID'].toString();	
								} else {
									return null;
								}
							})
							relatedCompIDs = _.filter(relatedCompIDs, Boolean);
							_.each(comps, function(relatedComp, relatedCompIndex){
								if(relatedCompIDs.indexOf(relatedComp.id) > -1){
									//push the sub component onto the array after the parent
									correctCompOrder.push(relatedComp);
								}
							})
						}
					});

					//Now go through and add all the components that aren't parents or already included as sub-components
					var alreadyListedCompIDs = _.map(correctCompOrder, function(item){ return item.id; });
					_.each(comps, function(oneComponent, compIndex){
						if( alreadyListedCompIDs.indexOf(oneComponent.id) == -1 ){
							correctCompOrder.push(oneComponent);
						}
					})

					//Copy the correct order into the normal comps array;
					comps = correctCompOrder;

					// Now build the actual paragraphs using the correct order.
					for(i=0; i < comps.length; i++){
						if(comps[i].text){
							pObj = docx.createP ();
							
							// Here's the first sentence of the component paragraph. Since the title ("text") is optional,
							// it just puts the first description instead.  It also tacks on whether it's a subcomponent
							pObj.addText( 'An embodiment of the invention incorporates ' +
								comps[i].text.toLowerCase(), { font_size: 14, font_face: 'Times New Roman' } );

							if(comps[i].relatedComps && comps[i].relatedComps.length > 0){
								var foundParentComp = false;
								_.each(comps[i].relatedComps, function(eachOne, index){
									if(eachOne['subComponent'] && eachOne['subComponent'] == "sub-component" && !foundParentComp) {
										// If this component is a sub-component of another component, find title or first description
										// of the parent component

										//we can't assume there's only one
										_.each(comps, function(singleComp, compIndex){
											if(eachOne['compID'].toString() == singleComp.id.toString() && !foundParentComp){
												var parentCompTitle = singleComp.text || singleComp.descriptions[0] || "no component name"
												pObj.addText( ', a sub-component of ' + parentCompTitle.toLowerCase(), { font_size: 14, font_face: 'Times New Roman' } );
												foundParentComp = true;
											}
										})
									}
								})
							}
							if(comps[i]['mainImage']){
								//if there's a main image for the component, mention which figure its depicted in.
								for(var j=0;j<images.length; j++){
									if(comps[i]['mainImage'].toString() == images[j].id.toString()){
										pObj.addText( ', as depicted by Figure ' + (j+1), { font_size: 14, font_face: 'Times New Roman' } );
									}
								}
							}

							pObj.addText( '. ', { font_size: 14, font_face: 'Times New Roman' } );

							
							// This section is for the dimensions
							if(comps[i].dimensions.length > 0){
								pObj.addText( 'The preferred embodiment of the ' + comps[i].text + ' comprises the following dimensions: ' + comps[i].dimensions[0] + ". ", { font_size: 14, font_face: 'Times New Roman' } );
								if(comps[i].dimensions.length > 1){
									_.each(comps[i].dimensions.slice(1), function(eachDimension, index){
										if(eachDimension){
											pObj.addText( 'Another embodiment of the ' + comps[i].text + ' comprises the dimensions of ' + eachDimension + ". ", { font_size: 14, font_face: 'Times New Roman' } );
										}
									})
								}
							}

							// This section is for the materials
							if(comps[i].dimensions.length > 0){
								pObj.addText( 'The preferred embodiment of the ' + comps[i].text + ', incorporates ' + comps[i].materials[0] + " in its composition. ", { font_size: 14, font_face: 'Times New Roman' } );
								if(comps[i].materials.length > 1){
									_.each(comps[i].materials.slice(1), function(eachMaterial, index){
										if(eachMaterial){
											pObj.addText( 'Alternatively ' + comps[i].text + ' incorporates ' + eachMaterial + "in its composition. ", { font_size: 14, font_face: 'Times New Roman' } );
										}
									})
								}
							}

							if(comps[i].descriptions.length > 0 && comps[i].problemID){
								pObj.addText( 'The present inventor has recognized that ' +
								comps[i].descriptions[0].toLowerCase() + ' addresses a variety of previously unsolved challenges, including ', { font_size: 14, font_face: 'Times New Roman' } );
								for(j=0; j < problems.length; j++){
									if(comps[i].problemID.id.toString() == problems[j]['_id'].toString()){
										pObj.addText( problems[j]['text'] + '.  ', { font_size: 14, font_face: 'Times New Roman' } );
									}
								}
							}	

							if(comps[i].descriptions.length > 1 && !comps[i].text){
								for(j=1; j < comps[i].descriptions.length; j++){
									pObj.addText( ''+comps[i].descriptions[0] + ' in an embodiment of the invention is described as ', { font_size: 14, font_face: 'Times New Roman' } );
									pObj.addText( comps[i].descriptions[j] + '. ', { font_size: 14, font_face: 'Times New Roman' } );
								}
							} else {
								for(j=1; j < comps[i].descriptions.length; j++){
									pObj.addText( ''+comps[i].text + ' in an embodiment of the invention is described as ', { font_size: 14, font_face: 'Times New Roman' } );
									pObj.addText( comps[i].descriptions[j] + '. ', { font_size: 14, font_face: 'Times New Roman' } );
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
												pObj.addText( 'In an embodiment of the invention, ' + comps[i].text.toLowerCase() + ' and ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( otherCompName.toLowerCase() + ' are related. ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( comps[i].text.toLowerCase() + ' and ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( otherCompName + ' are related to one another in such embodiment by ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( comps[i].relatedComps[j].relationship.toLowerCase(), { font_size: 14, font_face: 'Times New Roman' } );
											} else if(!comps[k].text && comps[i].text) {
												otherCompName = comps[k].descriptions[0];
												pObj = docx.createP ();
												pObj.addText( 'In an embodiment of the invention, ' + comps[i].text.toLowerCase() + ' and ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( otherCompName.toLowerCase() + ' are related. ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( comps[i].text.toLowerCase() + ' and ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( otherCompName + ' are related to one another in such embodiment by ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( comps[i].relatedComps[j].relationship.toLowerCase(), { font_size: 14, font_face: 'Times New Roman' } );
											} else if(comps[k].text && !comps[i].text) {
												otherCompName = comps[k].text;
												pObj = docx.createP ();
												pObj.addText( 'In an embodiment of the invention, ' + comps[i].descriptions[0].toLowerCase() + ' and ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( otherCompName.toLowerCase() + ' are related. ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( comps[i].descriptions[0].toLowerCase() + ' and ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( otherCompName + ' are related to one another in such embodiment by ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( comps[i].relatedComps[j].relationship.toLowerCase(), { font_size: 14, font_face: 'Times New Roman' } );
											} else if(!comps[k].text && !comps[i].text) {
												otherCompName = comps[k].descriptions[0];
												pObj = docx.createP ();
												pObj.addText( 'In an embodiment of the invention, ' + comps[i].descriptions[0].toLowerCase() + ' and ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( otherCompName.toLowerCase() + ' are related. ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( comps[i].descriptions[0].toLowerCase() + ' and ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( otherCompName + ' are related to one another in such embodiment by ', { font_size: 14, font_face: 'Times New Roman' } );
												pObj.addText( comps[i].relatedComps[j].relationship.toLowerCase(), { font_size: 14, font_face: 'Times New Roman' } );
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
						'teachings.', { font_size: 14, font_face: 'Times New Roman' } );
					pObj = docx.createP ();
					pObj.addText( 'The benefits, advantages, solutions to problems, and any element(s) that may cause any '+
						'benefit, advantage, or solution to occur or become more pronounced are not to be construed as a critical, '+
						'required, or essential features or elements of any or all the claims. The invention is defined solely '+
						'by the appended claims including any amendments made during the pendency of this application and all '+
						'equivalents of those claims as issued.', { font_size: 14, font_face: 'Times New Roman' } );
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
						'imply or require that sequence.', { font_size: 14, font_face: 'Times New Roman' } );

					docx.putPageBreak ();
					pObj = docx.createP ();
					pObj.addText( 'CLAIMS', { font_size: 14, font_face: 'Times New Roman' } );
					pObj = docx.createP ();
					pObj.addText( 'I claim:', { font_size: 14, font_face: 'Times New Roman' } );
					pObj = docx.createP ();
					pObj.addText( '1. The invention described herein.', { font_size: 14, font_face: 'Times New Roman' } );

					for(var i=0;i<images.length; i++){
						console.log("this i is " + i)
						docx.putPageBreak ();
						pObj = docx.createP ();
						if (fs.existsSync(__dirname + '/figure-' + (i+1) +'.png')) {
							//fs.stat(__dirname + '/figure-' + (i+1) +'.png', function(err, stats) {
								//if(stats['size'] > 0){
									//console.log("size is " + stats['size'])
									console.log("i is " + i)
									console.log("images length is " + images.length)
									pObj.addText( 'Figure ' + (i+1), { font_size: 14, font_face: 'Times New Roman' } );
									pObj.addImage(__dirname + '/figure-' + (i+1) +'.png', { cx: 600, cy: 400 } ) ;
								//}
							//});
						} else {
							console.log("figure " + i + " is not working")
						}
					}

					docx.generate ( res, {
				    'finalize': function ( written ) {
								for(i=0;i<images.length; i++){
									if (fs.existsSync(__dirname + '/figure-' + (i+1) +'.png')) {
										fs.unlink(__dirname + '/figure-' + (i+1) +'.png');
									}
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
			
			var s3 = new aws.S3({
				accessKeyId : process.env.accessKeyId,
				secretAccessKey : process.env.secretAccessKey
			});
			var params = {
				Bucket: 'qonspire',
				Key: images[number].amazonURL.split('/')[3]
			};


			s3.getObject(params).
				on('error', function(error){
					console.log('error is ' + error);
				}).
				on('complete', function(response) {
					console.log(images[number].amazonURL)
					if(images[number].imageMimetype && response.data && response.data.Body){
						var imageSrc = "data:" + images[number].imageMimetype + ";base64," + response.data.Body.toString('base64');
						img['src'] = imageSrc || "hi";
						if (img){
			        ctx.translate(500, 350);
			        if(images[number].orientation == 6 ){
			          ctx.rotate(90*Math.PI/180);
			        }
			        if(images[number].orientation == 3){
			          ctx.rotate(180*Math.PI/180);
			        }
			        if(images[number].orientation == 8){
			          ctx.rotate(270*Math.PI/180);
			        }
			        
			        ctx.drawImage(img, -300, -200, 600, 400);

			        //not sure why this is needed, but not on the annotate-image page
			        ctx.translate(-500, -350);
						
							// This part takes the image from Amazon S3 and overlays all the annotated
							// components over it to lay into the Word File
							//
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

							var data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
							var buf = new Buffer(data, 'base64');
							fs.writeFile(__dirname + '/figure-' + (number+1) +'.png', buf, 'base64', function(err) {
  							if(err) console.log(err);
								if(number < images.length - 1){
									number++;
									renderImage(number);
									// once all the images are created, create the rest of the word document
								} else if (number == images.length - 1 ){
									console.log("now were going in here")
									createWordDoc();

								}
							});
						} else {
							console.log('img has no src');
							if(number < images.length - 1){
								number++;
								renderImage(number);
							// once all the images are created, create the rest of the word document
							} else if (number == images.length - 1 ){
								createWordDoc();

							}

						}
					} else {
						console.log('s3 image not returned correctly');
						if(number < images.length - 1){
							number++;
							renderImage(number);
						// once all the images are created, create the rest of the word document
						} else if (number == images.length - 1 ){
							createWordDoc();

						}

					}
				}).
				send();
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

IdeaSeed.statics.getCategoryAbbreviatedName = function(tactic, target){
	var concatVersion = tactic + " " + target;
		switch ( concatVersion ) {
			case "Eliminate Functions": return "elim-func";

			case "Eliminate Parts": return "elim-parts";

			case "Eliminate Life-Cycle Processes": return "elim-life";

			case "Eliminate Materials": return "elim-mat";

			case "Eliminate People": return "elim-people";

			case "Reduce Functions": return "reduce-func";

			case "Reduce Parts": return "reduce-parts";

			case "Reduce Life-Cycle Processes": return "reduce-life";

			case "Reduce Materials": return "reduce-mat";

			case "Reduce People": return "reduce-people";

			case "Substitute Functions": return "sub-func";

			case "Substitute Parts": return "sub-parts";

			case "Substitute Life-Cycle Processes": return "sub-life";

			case "Substitute Materials": return "sub-mat";

			case "Substitute People": return "sub-people";

			case "Separate Functions": return "sep-func";

			case "Separate Parts": return "sep-parts";

			case "Separate Life-Cycle Processes": return "sep-life";

			case "Separate Materials": return "sep-mat";

			case "Separate People": return "sep-people";

			case "Integrate Functions": return "int-func";

			case "Integrate Parts": return "int-parts";

			case "Integrate Life-Cycle Processes": return "int-life";

			case "Integrate Materials": return "int-mat";

			case "Integrate People": return "int-people";

			case "Re-Use Functions": return "reuse-func";

			case "Re-Use Parts": return "reuse-parts";

			case "Re-Use Life-Cycle Processes": return "reuse-life";

			case "Re-Use Materials": return "reuse-mat";

			case "Re-Use People": return "reuse-people";

			case "Standardize Functions": return "stand-func";

			case "Standardize Parts": return "stand-parts";

			case "Standardize Life-Cycle Processes": return "stand-life";

			case "Standardize Materials": return "stand-mat";

			case "Standardize People": return "stand-people";

			case "Add Functions": return "add-func";

			case "Add Parts": return "add-parts";

			case "Add Life-Cycle Processes": return "add-life";

			case "Add Materials": return "add-mat";

			case "Add People": return "add-people";

			default: return "other";
		}
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