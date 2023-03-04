async function getFilenamesArray(url, body, method = "POST",){
    return await fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    })
        .then(response => response.json())
}

export {getFilenamesArray}