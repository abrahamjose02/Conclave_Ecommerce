

//view the products on a single category.
function viewProducts(categoryId) {
    window.location.href = `/products?category=${categoryId}`;
}



//view the product Details of single product
function viewProductDetails(categoryId, productId) {
    window.location.href = `/productDetails?category=${categoryId}&productId=${productId}`;
}




let selectedSize = null;

function handleSizeSelection(size) {
    // Remove previous selection style (if any)
    const prevSelectedButton = document.querySelector('.size-box.selected');
    if (prevSelectedButton) {
        prevSelectedButton.classList.remove('selected');
    }

    // Update the selected size
    selectedSize = size;

    // Toggle the style for the selected button
    const selectedButton = event.currentTarget;
    selectedButton.classList.add('selected');
}


function addToCart(productId, size) {
    $.ajax({
        url: '/add-to-cart/' + productId + '?size=' + size,
        method: 'GET',
        success: (response) => {
            if (response.status) {
                Swal.fire(
                    'Added!',
                    'Product added to cart',
                    'success'
                ).then(() => {
                    
                    window.location.href = '/cart'; // Redirect to /cart page
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'You need to login',
                    footer: '<a href="/">Click here to Login</a>'
                });
            }
        },
        error: (err) => {
            console.error('Error:', err);
        }
    });
}



function selectSizeAndAddToCart(productId) {
    if (!selectedSize) {
        alert('Please select a size.');
        return;
    }

    // Call addToCart function with productId and selectedSize
    addToCart(productId, selectedSize);
}




// Ajax to change the quantity in the cart

// Plus button click event
$('.plus-btn').on('click', function() {
    const itemId = $(this).data('itemid');
    changeQuantity(itemId, '1');
});

// Minus button click event
$('.minus-btn').on('click', function() {
    const itemId = $(this).data('itemid');
    changeQuantity(itemId, '-1');
});

// Function to change quantity via AJAX
function changeQuantity(itemId, quantityChange) {
    $.ajax({
        type: 'POST',
        url: '/changeQuantity',
        data: {
            itemId: itemId,
            quantityChange: quantityChange
        },
        success: function(response) {
            if (response.status === 'success') {
                // Update the displayed quantity
                $('#' + itemId).text(response.quantity);
                // Update total price per item
                $('#total' + itemId).text(response.price);
                // Update the cart total
                $('#grandTotal').text(response.totalPrice);
            }
        },
        error: function(err) {
            console.error('Error:', err);
        }
    });
}




// To remove the product from the cart

// Remove button click event
$('.remove-btn').on('click', function() {
    const itemId = $(this).data('itemid');
    removeProduct(itemId);
});

function removeProduct(itemId) {
    $.ajax({
        type: 'POST',
        url: '/removeProduct/' + itemId,
        success: function(response) {
            if (response.status === 'success') {
                // Remove the item from the page
                $('#item' + itemId).remove(); // Adjust the selector to match your HTML structure
                location.reload(); // Refresh the page to reflect the updated cart
            } else {
                console.log('Failed to remove the product');
            }
        },
        error: function(err) {
            console.error('Error:', err);
        }
    });
}


















