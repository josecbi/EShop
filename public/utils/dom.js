export function createElement(tagName, className = "", textContent) {
    const element = document.createElement(tagName)
    if (className) {
        element.className = className
    }
    if (textContent !== undefined) {
        element.textContent = textContent
    }
    return element
}

export function createStatus(message, role = "status") {
    const status = createElement("p", "products-status", message)
    status.setAttribute("role", role)
    return status
}
