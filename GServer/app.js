const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const logger = require('morgan');
const Request = require('request');
// const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const index = require('./routes/index');
const users = require('./routes/users');
const notices = require('./routes/notices');
const banks = require('./routes/banks');
const stations = require('./routes/stations');
const reports = require('./routes/reports');
const errands = require('./routes/errands');

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/banks', banks);
app.use('/errands', errands);
app.use('/notices', notices);
app.use('/reports', reports);
app.use('/stations', stations);
app.use('/users', users);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    // res.locals.message = err.message;
    // res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json({msg: err.message, data: null});
    const slackConfig = require('./config/config.json')['slack'];
    if (slackConfig) {
        Request
            .post(slackConfig.url)
            .form({
                payload: JSON.stringify({

                    'channel': slackConfig.channel,
                    'username': slackConfig.username,
                    'icon_emoji': slackConfig.icon_emoji,
                    'attachments': [
                        {
                            'color': 'danger',
                            'pretext': 'Error has benn occuerd',
                            'title': req.method + ' ' + req.url,
                            'text': err.message,
                            'footer': 'From_AWS',
                            'footer_icon': 'https://platform.slack-edge.com/img/default_application_icon.png',
                            'ts': new Date().getTime() / 1000
                        }
                    ]
                })
            });
    }
});

module.exports = app;
