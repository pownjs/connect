const init = (options, scheduler) => {
    const { connectTimeout, dataTimeout, acceptAnauthorized, tls } = options

    if (connectTimeout) {
        scheduler.on('connect-scheduled', (connect) => {
            connect.connectTimeout = connectTimeout
        })
    }

    if (dataTimeout) {
        scheduler.on('connect-scheduled', (connect) => {
            connect.dataTimeout = dataTimeout
        })
    }

    scheduler.on('connect-scheduled', (connect) => {
        connect.rejectUnauthorized = !acceptAnauthorized
        connect.tls = tls
    })
}

module.exports = { init }
