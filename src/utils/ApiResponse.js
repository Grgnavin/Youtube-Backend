class ApiResponse {
    constructor(
        data,
        statusCode,
        message = "Sucess"
    ){
        this.data = data
        this.message = message
        this.statusCode = statusCode
        this.success = statusCode < 400
    }
}

export { ApiResponse }