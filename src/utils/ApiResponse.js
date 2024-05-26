class ApiResponse {
    constructor(
        data,
        statusCode,
        message = "Sucess"
    ){
        this.statusCode = data
        this.message = message
        this.data = statusCode
        this.success = statusCode < 400
    }
}

export { ApiResponse }