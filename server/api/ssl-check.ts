import { defineEventHandler, getQuery, createError } from 'h3'
import * as tls from 'tls'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const host = query.host as string
  const port = parseInt(query.port as string || '443')

  if (!host) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Host is required',
    })
  }

  return new Promise((resolve, reject) => {
    try {
      const socket = tls.connect({
        host,
        port,
        servername: host, // SNI
        rejectUnauthorized: false // We want to see even expired/invalid certs
      }, () => {
        const cert = socket.getPeerCertificate(true)
        socket.destroy()

        if (!cert || Object.keys(cert).length === 0) {
          reject(createError({
            statusCode: 404,
            statusMessage: 'No certificate found',
          }))
          return
        }

        // Parse and return relevant info
        resolve({
          subject: cert.subject,
          issuer: cert.issuer,
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber,
          bits: cert.bits,
          exponent: cert.exponent,
          ext_key_usage: cert.ext_key_usage,
          subjectaltname: cert.subjectaltname,
          infoAccess: cert.infoAccess,
          modulus: cert.modulus,
          raw: cert.raw.toString('base64')
        })
      })

      socket.on('error', (err) => {
        socket.destroy()
        reject(createError({
          statusCode: 500,
          statusMessage: `Connection failed: ${err.message}`,
        }))
      })

      // Timeout after 10 seconds
      socket.setTimeout(10000, () => {
        socket.destroy()
        reject(createError({
          statusCode: 408,
          statusMessage: 'Connection timeout',
        }))
      })

    } catch (err: any) {
      reject(createError({
        statusCode: 500,
        statusMessage: err.message,
      }))
    }
  })
})
