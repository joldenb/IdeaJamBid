  var helper = require('sendgrid').mail
  from_email = new helper.Email('joseph.oldenburg@gmail.com ')
  to_email = new helper.Email('sean.helvey@gmail.com')
  subject = 'Hello World from the SendGrid Node.js Library!'
  content = new helper.Content('text/plain', 'Hello, Email!')
  mail = new helper.Mail(from_email, subject, to_email, content)

  var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
  var request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON()
  });

  sg.API(request, function(error, response) {
    console.log(response.statusCode)
    console.log(response.body)
    console.log(response.headers)
  })