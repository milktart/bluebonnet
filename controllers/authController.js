const bcrypt = require('bcrypt');
const { User, TravelCompanion } = require('../models');

exports.getLogin = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.getRegister = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.postRegister = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    
    if (existingUser) {
      req.flash('error_msg', 'Email already registered');
      return res.redirect('/auth/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName
    });

    // Auto-link any existing travel companions with this email
    const companionsToLink = await TravelCompanion.findAll({
      where: {
        email: email.toLowerCase(),
        userId: null // Only link companions that aren't already linked
      }
    });

    if (companionsToLink.length > 0) {
      // Link all companions to this new user account
      await Promise.all(
        companionsToLink.map(companion =>
          companion.update({ userId: newUser.id })
        )
      );

      const companionCount = companionsToLink.length;
      req.flash('success_msg',
        `Registration successful! ${companionCount} travel companion${companionCount > 1 ? 's' : ''} automatically linked to your account. Please log in.`
      );
    } else {
      req.flash('success_msg', 'Registration successful! Please log in.');
    }

    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/auth/register');
  }
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  });
};