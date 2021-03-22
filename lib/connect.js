const net = require('net')
const tls = require('tls')
const performanceNow = require('performance-now')

const EMPTY_BUFFER = Buffer.alloc(0)

const socketCleanup = async(socket) => {
    // NOTE: force socket closure just in case

    try {
        socket.destroy()
    }
    catch (e) {
        // pass
    }
}

const connectInternal = (connect, resolve) => {
    const { type = 'base', host, port, data, info, timeout = 30000, connectTimeout = timeout, dataTimeout = timeout, certificate = false, download = true, ssl: _ssl = false, tls: _tls = _ssl, client = _tls ? tls : net } = connect

    const now = performanceNow()

    const transaction = {
        type,

        host,
        port,

        data,

        responseData: EMPTY_BUFFER,

        info: {
            ...info,

            open: false,

            startTime: now,
            stopTime: now
        }
    }

    const responseDataChunks = []

    const socket = client.connect(port, host)

    let connectTimeoutHandler

    if (connectTimeout) {
        socket.setTimeout(connectTimeout)

        connectTimeoutHandler = setTimeout(() => {
            socket.emit('timeout')
        }, connectTimeout)
    }

    socket.on('connect', () => {
        clearTimeout(connectTimeoutHandler)

        transaction.info.open = true

        if (data) {
            socket.write(data)
        }
    })

    socket.on('secureConnect', () => {
        clearTimeout(connectTimeoutHandler)

        transaction.info.open = true

        if (certificate && _tls) {
            try {
                transaction.info.certificate = socket.getPeerCertificate()
            }
            catch (e) {}
        }
    })

    let dataTimeoutHandler

    if (download) {
        if (dataTimeout) {
            dataTimeoutHandler = setTimeout(() => {
                socket.emit('timeout')
            }, dataTimeout)
        }

        socket.on('data', (data) => {
            clearTimeout(dataTimeoutHandler)

            responseDataChunks.push(data)

            if (dataTimeout) {
                dataTimeoutHandler = setTimeout(() => {
                    socket.emit('timeout')
                }, dataTimeout)
            }
        })
    }

    socket.on('timeout', async(error) => {
        clearTimeout(connectTimeoutHandler)
        clearTimeout(dataTimeoutHandler)

        error = error || new Error(`Timeout`)

        await socketCleanup(socket)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseData = Buffer.concat(responseDataChunks)

        resolve(transaction)
    })

    socket.on('error', async(error) => {
        clearTimeout(connectTimeoutHandler)
        clearTimeout(dataTimeoutHandler)

        error = error || new Error(`Error`)

        await socketCleanup(socket)

        transaction.info.error = error
        transaction.info.stopTime = performanceNow()
        transaction.responseData = Buffer.concat(responseDataChunks)

        resolve(transaction)
    })

    socket.on('close', async() => {
        clearTimeout(connectTimeoutHandler)
        clearTimeout(dataTimeoutHandler)

        await socketCleanup(socket)

        transaction.info.stopTime = performanceNow()
        transaction.responseData = Buffer.concat(responseDataChunks)

        resolve(transaction)
    })
}

const connect = (connect) => new Promise((resolve, reject) => {
    try {
        // all paths are happy paths

        connectInternal(connect, resolve)
    }
    catch (e) {
        reject(e)
    }
})

module.exports = { connect }
