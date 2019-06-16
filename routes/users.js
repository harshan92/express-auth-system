var express = require('express');
var router = express.Router();
var multer=require('multer');
var uploads=multer({dest:'./uploads'});
var User=require('../models/user');
var passport=require('passport');
var LocalStrategy=require('passport-local').Strategy;
var flash=require('connect-flash');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
});

router.post('/login',
  passport.authenticate('local',{'failureRedirect':'/users/login', 'failureFlash':'Invalid username or password'}),
  function(req, res) {
    // If this function gets called, authentication was successful.
    // `req.user` contains the authenticated user.
    req.flash('success', 'You are logged in...');
     res.redirect('/');
  });

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new LocalStrategy(function(username, password, done){
    User.getUserByUsername(username,function(err, user){
      if(err) throw err;
      if(!user){
        return done(null,false,{'message':'Unknown user'})
      }

      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) return done(err);
        if(isMatch){
          return done(null, user);
        }else{
          return done(null, false, {'message':'Invalid password'});
        }
      });
    });
  }));

//post req
router.post('/register',uploads.single('profileImage'),function(req, res, next) {
  var name=req.body.name;
  var email=req.body.email;
  var username=req.body.username;
  var password=req.body.password;
  var password2=req.body.password2;

  if(req.file){
    console.log('Uploading File...');
    var profileImage=req.file.filename;
  }else{
    console.log('No File Uploaded ...');
    var profileImage='noimage.jpg';
  }

  //form validater
  req.checkBody('name', 'Name field is required.').notEmpty();
  req.checkBody('email', 'Email is required.').notEmpty();
  req.checkBody('email', 'Email is not valid.').isEmail();
  req.checkBody('username', 'Userame is required.').notEmpty();
  req.checkBody('password', 'Password field is required.').notEmpty();
  req.checkBody('password2', 'Passwords do not match.').equals(req.body.password);
  
  var errors = req.validationErrors();

  if(errors){
    console.log('Errors');
    res.render('register',{errors:errors});
    
  }else{
    var newUser=new User({
      name:name,
      username:username,
      password:password,
      email:email,
      profileImage:profileImage
    });

    User.createUser(newUser,function(err, user){
      if(err){
        req.flash('fail', 'You are not now registered..')
        res.location('/');
        res.redirect('/');
      }
      console.log(user);
    });
    req.flash('success', 'You are now registered and you can login..')
    res.location('/');
     res.redirect('/');
  }
});

router.get('/logout',function(req, res){
  req.logout();
  req.flash('success', 'You are now logged out..');
   res.redirect('/users/login');
})

module.exports = router;
