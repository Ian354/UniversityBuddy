const express = require('express');

const app = express();
app.use(express.json());

//cors
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const usersRouter = require('./routes/users');
const universityRouter = require('./routes/universities');
const cityRouter = require('./routes/city');
const countryRouter = require('./routes/country');
const erasmusRouter = require('./routes/erasmus');
const eventRouter = require('./routes/event');
const reviewRouter = require('./routes/review');
const authRouter = require('./routes/auth');
const mentorAvailability = require('./routes/mentorAvailability');
const forumRouter = require('./routes/forum');
const cityForumRouter = require('./routes/cityForum');
const countryForumRouter = require('./routes/countryForum');
const studentMentorRouter = require('./routes/studentMentor');
const mentorGroupForumRouter = require('./routes/mentorGroupForum');
const mentorshipGroupRouter = require('./routes/mentorshipGroup');

app.use('/users', usersRouter);
app.use('/university', universityRouter);
app.use('/city', cityRouter);
app.use('/country', countryRouter);
app.use('/erasmus', erasmusRouter);
app.use('/event', eventRouter);
app.use('/review', reviewRouter);
app.use('/auth', authRouter);
app.use('/mentorAvailability', mentorAvailability);
app.use('/forum', forumRouter);
app.use('/cityForum', cityForumRouter); 
app.use('/countryForum', countryForumRouter);
app.use('/studentMentor', studentMentorRouter);
app.use('/mentorGroupForum', mentorGroupForumRouter);
app.use('/mentorshipGroup', mentorshipGroupRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});