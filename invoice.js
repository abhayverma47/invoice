var https = require('https')
var fs = require('fs')
const keygen = require('keygenerator')
const sgMail = require('@sendgrid/mail')
const buffer = require('buffer').Buffer

sgMail.setApiKey(
  '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'
)

function generateInvoice(invoice, filename, success, error) {
  var postData = JSON.stringify(invoice)
  var options = {
    hostname: 'invoice-generator.com',
    port: 443,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  }

  var file = fs.createWriteStream(filename)

  var req = https.request(options, function (res) {
    res
      .on('data', async function (chunk) {
        file.write(chunk)
      })
      .on('end', function () {
        file.end()

        if (typeof success === 'function') {
          success()
        }
      })
  })
  req.write(postData)
  req.end()

  if (typeof error === 'function') {
    req.on('error', error)
  }
}

const invoiceEmailer = async (data) => {
  const { name, product, template } = data
  const value = data.amount - 5
  const invoiceNumber = data.invoice

  const code = keygen.password({
    length: 3,
  })

  var invoice = {
    logo: '',
    from: 'Wall St Bible\n87 W Ramona St\nVentura, CA 93001',
    to: name,
    currency: 'usd',
    number: invoiceNumber,
    payment_terms: 'Auto-Billed - Do Not Pay',
    items: [
      {
        name: product,
        quantity: 1,
        unit_cost: value,
      },
    ],
    fields: {
      tax: 'true',
    },
    tax: 5,
    notes: 'Thanks for being an awesome customer!',
    terms:
      'No need to submit payment. You will be auto-billed for this invoice.',
  }

  const emailer = async (email, template) => {
    fs.readFile(`${__dirname}/${code}.pdf`, (err, data) => {
      if (err) {
        // do something with the error
      }
      if (data) {
        const buf = buffer.from(data).toString('base64')
        const msg = {
          to: email,
          from: 'juan@wallstbible-discord.com',
          template_id: template,
          dynamic_template_data: {
            Sender_Name: 'Juan Avina',
            Sender_Address: '87 W Ramona St',
            Sender_City: 'Ventura',
            Sender_State: 'CA',
            Sender_Zip: '93001',
          },
          attachments: [
            {
              content: buf,
              filename: 'invoice.pdf',
              type: 'application/pdf',
              disposition: 'attachment',
            },
          ],
        }
        sgMail.send(msg).catch((err) => {
          console.log(err)
        })
        setTimeout(() => {
          fs.unlink(`${code}.pdf`, (err) => {
            if (err) {
              throw err
            }
          })
        }, 5000)
      }
    })
  }

  generateInvoice(
    invoice,
    `${code}.pdf`,
    async function () {
      console.log('Saved invoice to email and then removed')
      await emailer(name, template)
    },
    function (error) {
      console.error(error)
    }
  )
}

invoiceEmailer({
  name: 'abhaygamingprophet2014@gmail.com',
  amount: 50,
  product: 'test',
  template: 'd-a2fefaa9f74d47cf90a56fab70f3303e',
  invoice: '2349999',
})
