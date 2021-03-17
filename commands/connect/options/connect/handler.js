const init = (options, scheduler) => {
    const { connectTimeout, dataTimeout, acceptAnauthorized } = options

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
    })
}

module.exports = { init }
