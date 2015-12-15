//Needed modules to ensure proper compilation of in-file operations
var path = require('path')
var express = require('express');
var app = express();
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer({ dest: './image_uploads/' });
var email   = require("emailjs");

var server  = email.server.connect({
   user:    "candyleasebeta", 
   password:"leasecandy123", 
   host:    "smtp.gmail.com", 
   ssl:     true
});

// send the message and get a callback with an error or details of the message that was sent
/*server.send({
   text:    "i hope this works", 
   from:    "me <padhuntertest@gmail.com>", 
   to:      "you <richardsdossey@gmail.com>",
   cc:      "else <else@your-email.com>",
   subject: "testing emailjs"
}, function(err, message) { console.log(err || message); });*/




/*
app.use(bodyParser({uploadDir: './image_uploads/',keepExtensions: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded();
*/




////schemas needed for the model
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;


var User_Schema = new Schema({
  Id : ObjectId,
  username : String,
  email: String,
  password : String,
  Date_joined: Date, 
});





var Listing_Schema = new Schema({
    Id  : ObjectId,
    title : String,
    description : String,
    date_submitted : Date,
    contact_email: String,
    housing_type: String,
    bedrooms: Number,
    bathrooms: Number,
    city: String,
    neighborhood: String,
    img: Buffer,
    price: Number,
    state: String

});




//////Mongoose models and a user model for later when user 
var Listing = mongoose.model('Listing', Listing_Schema);

var User_instance = mongoose.model('User', User_Schema);

router.get('/aboutus', function(req,res){
    res.render('aboutus');
});

router.get('/contactus', function(req,res){
    res.render('contactus');
});



router.get('/test', function(req,res){
  res.send(req.query.stuff);
});



/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '', state_options:states});
});

///View for individual listings
router.get('/listing-info/:listing_id', function(req, res){
	Listing.findOne({_id:req.params.listing_id}, function(err, listing_details){
////Concacting the image file name with the static file url I set up in app.js to get the url that file is stored under.
///Then sending it to the view to be used as an image source.
	var image_url = "/listing_images/" + listing_details.img;
  var message_action = "/send-message/" + listing_details.id;
  res.render('listing_details', {listing_info:listing_details, image_location:image_url, message_sender:message_action});
	});
});


router.get('/all', function(req, res){
  Listing.find({}, function(err, listing_details){
    res.send(listing_details);
  /*res.render('listing_details', {listing_info:listingimg.datails});*/
  });
});



//search engine filter using the mongoose query builder. (check mongoose docs for more info and sytnax).
///A little bit of callback hell here. Watchout!
router.post('/search', function(req,res){
///This will make sure all search queries in the cities are lower case since MONGODB is case sensitive. 
var city = req.body.city;
var lower_case_city = city.toLowerCase();

  Listing.find().
  where('price').gt(req.body.min).lt(req.body.max).
  where('bedrooms').equals(req.body.bedrooms).
  where('city').equals(lower_case_city).
  where('state').equals(req.body.state).
  where('bathrooms').equals(req.body.bathrooms).
  sort('date_submitted').
  exec(function(err, listings_docs){
    
/*This query get's search information of a broader set of parameters. Getting docuemnts in that city and price range.
*/
    Listing.find().
    where('city').equals(lower_case_city).
    where('state').equals(req.body.state).
    where('price').gt(req.body.min).lt(req.body.max).
    sort('price').
    exec(function(err, listings_docs_city){          
            if(err){console.log(err);}
            if(!err){
              var image_url_src = "/listing_images/"+listings_docs_city.img;
              res.render('search', {Results:listings_docs, City_Results: listings_docs_city,image_url:image_url_src,state_options:states});
            }

    });
  });
});


router.get('/search', function(req,res){
  res.render('search', {Results:"",City_Results:"",state_options:states});
});

///testing the query for the search engine! 
        router.get('/sort-price', function(req, res){
          Listing.find({}).where('price').gt(1000).lt(8000).exec(function(err, listing_details){
    res.send(listing_details);
  /*res.render('listing_details', {listing_info:listingimg.datails});*/
  });
});

/*Here I retrieve the id that is sent a URI parameter in the form from the listing details
page. I then search the database for the document and then send the message to the documents email string.*/
router.post('/send-message/:listing_id', function(req,res){
  Listing.findOne({_id:req.params.listing_id}, function(err, listing_details){
    var listing_email = listing_details.contact_email;
    server.send({
   text:    req.body.message +" ||****** To respond simply reply to this email! ******||", 
   from:    "<padhuntertest@gmail.com>", 
   to:      listing_email,
   "reply-to": listing_email + "," + req.body.email,
   subject: "Someone wants to know more about your listing!"
}, function(err, message) {
        res.render('message');

        }
    );
  });
});


////View for adding a listing
router.get('/add-listing', function(req,res){
  res.render('add_listing',{state_options:states});
});

///Saving data from the from
router.post('/add-listing',upload.single('image'), function(req,res){
var city = req.body.city;
var lower_case_city = city.toLowerCase()


  var new_Listing = new Listing;
  new_Listing.title = req.body.title;
  new_Listing.city = lower_case_city;
  new_Listing.bedrooms = req.body.bedrooms;
  new_Listing.bathrooms = req.body.bathrooms
  new_Listing.state = req.body.state;
  new_Listing.housing_type = req.body.housing_type;
  new_Listing.description = req.body.description;
  new_Listing.img = req.file.filename;
  new_Listing.contact_email = req.body.email;
  new_Listing.date_submitted = Date.now();
  new_Listing.price = req.body.price;
  new_Listing.save();;
console.log(new_Listing._id);
var link = "http://candylease.com/listing-info/" + new_Listing._id;
server.send({
   text:    "Thank you for registing your listing with Candy Lease! Here is your link: "+ link +" . Feel free to share it with friends!" , 
   from:    "<info@candylease.com>", 
   to:      new_Listing.contact_email,
   subject: "Thank you for registering your listing!"
}, 
function(err, message) {

res.render('link_share', {Listing_link:link});
});

});





var states = [
    {
        "name": "Alabama",
        "abbreviation": "AL"
    },
    {
        "name": "Alaska",
        "abbreviation": "AK"
    },
    {
        "name": "American Samoa",
        "abbreviation": "AS"
    },
    {
        "name": "Arizona",
        "abbreviation": "AZ"
    },
    {
        "name": "Arkansas",
        "abbreviation": "AR"
    },
    {
        "name": "California",
        "abbreviation": "CA"
    },
    {
        "name": "Colorado",
        "abbreviation": "CO"
    },
    {
        "name": "Connecticut",
        "abbreviation": "CT"
    },
    {
        "name": "Delaware",
        "abbreviation": "DE"
    },
    {
        "name": "District Of Columbia",
        "abbreviation": "DC"
    },
    {
        "name": "Federated States Of Micronesia",
        "abbreviation": "FM"
    },
    {
        "name": "Florida",
        "abbreviation": "FL"
    },
    {
        "name": "Georgia",
        "abbreviation": "GA"
    },
    {
        "name": "Guam",
        "abbreviation": "GU"
    },
    {
        "name": "Hawaii",
        "abbreviation": "HI"
    },
    {
        "name": "Idaho",
        "abbreviation": "ID"
    },
    {
        "name": "Illinois",
        "abbreviation": "IL"
    },
    {
        "name": "Indiana",
        "abbreviation": "IN"
    },
    {
        "name": "Iowa",
        "abbreviation": "IA"
    },
    {
        "name": "Kansas",
        "abbreviation": "KS"
    },
    {
        "name": "Kentucky",
        "abbreviation": "KY"
    },
    {
        "name": "Louisiana",
        "abbreviation": "LA"
    },
    {
        "name": "Maine",
        "abbreviation": "ME"
    },
    {
        "name": "Marshall Islands",
        "abbreviation": "MH"
    },
    {
        "name": "Maryland",
        "abbreviation": "MD"
    },
    {
        "name": "Massachusetts",
        "abbreviation": "MA"
    },
    {
        "name": "Michigan",
        "abbreviation": "MI"
    },
    {
        "name": "Minnesota",
        "abbreviation": "MN"
    },
    {
        "name": "Mississippi",
        "abbreviation": "MS"
    },
    {
        "name": "Missouri",
        "abbreviation": "MO"
    },
    {
        "name": "Montana",
        "abbreviation": "MT"
    },
    {
        "name": "Nebraska",
        "abbreviation": "NE"
    },
    {
        "name": "Nevada",
        "abbreviation": "NV"
    },
    {
        "name": "New Hampshire",
        "abbreviation": "NH"
    },
    {
        "name": "New Jersey",
        "abbreviation": "NJ"
    },
    {
        "name": "New Mexico",
        "abbreviation": "NM"
    },
    {
        "name": "New York",
        "abbreviation": "NY"
    },
    {
        "name": "North Carolina",
        "abbreviation": "NC"
    },
    {
        "name": "North Dakota",
        "abbreviation": "ND"
    },
    {
        "name": "Northern Mariana Islands",
        "abbreviation": "MP"
    },
    {
        "name": "Ohio",
        "abbreviation": "OH"
    },
    {
        "name": "Oklahoma",
        "abbreviation": "OK"
    },
    {
        "name": "Oregon",
        "abbreviation": "OR"
    },
    {
        "name": "Palau",
        "abbreviation": "PW"
    },
    {
        "name": "Pennsylvania",
        "abbreviation": "PA"
    },
    {
        "name": "Puerto Rico",
        "abbreviation": "PR"
    },
    {
        "name": "Rhode Island",
        "abbreviation": "RI"
    },
    {
        "name": "South Carolina",
        "abbreviation": "SC"
    },
    {
        "name": "South Dakota",
        "abbreviation": "SD"
    },
    {
        "name": "Tennessee",
        "abbreviation": "TN"
    },
    {
        "name": "Texas",
        "abbreviation": "TX"
    },
    {
        "name": "Utah",
        "abbreviation": "UT"
    },
    {
        "name": "Vermont",
        "abbreviation": "VT"
    },
    {
        "name": "Virgin Islands",
        "abbreviation": "VI"
    },
    {
        "name": "Virginia",
        "abbreviation": "VA"
    },
    {
        "name": "Washington",
        "abbreviation": "WA"
    },
    {
        "name": "West Virginia",
        "abbreviation": "WV"
    },
    {
        "name": "Wisconsin",
        "abbreviation": "WI"
    },
    {
        "name": "Wyoming",
        "abbreviation": "WY"
    }
];



module.exports = router;

