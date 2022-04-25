const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productID]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const productElement = btn.closest('article');
    fetch('http://localhost:8686/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        },
    })
        .then(result => {
            return result.json();
        })
        .then(data => {
            productElement.parentNode.removeChild(productElement);
        })
        .catch(err => {
            console.log(err);
        })
}

