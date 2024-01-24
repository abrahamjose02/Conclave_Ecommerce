


//view the products on a single category.
function viewProducts(categoryId) {
    window.location.href = `/products?category=${categoryId}`;
}



//view the product Details of single product
function viewProductDetails(categoryId, productId) {
    window.location.href = `/productDetails?categoryId=${categoryId}&productId=${productId}`;
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
$('.plus-btn').on('click', function () {
    const itemId = $(this).data('itemid');
    changeQuantity(itemId, '1');
});

// Minus button click event
$('.minus-btn').on('click', function () {
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
        success: function (response) {
            if (response.status === 'success') {
                // Update the displayed quantity
                $('#' + itemId).text(response.quantity);
                // Update total price per item
                $('#total' + itemId).text(response.price);
                // Update the cart total
                $('#grandTotal').text(response.totalPrice);
            }
        },
        error: function (err) {
            console.error('Error:', err);
        }
    });
}


// To remove the product from the cart

// Remove button click event
$('.remove-btn').on('click', function () {
    const itemId = $(this).data('itemid');
    removeProduct(itemId);
});

function removeProduct(itemId) {
    $.ajax({
        type: 'POST',
        url: '/removeProduct/' + itemId,
        success: function (response) {
            if (response.status === 'success') {
                // Remove the item from the page
                $('#item' + itemId).remove(); // Adjust the selector to match your HTML structure
                location.reload(); // Refresh the page to reflect the updated cart
            } else {
                console.log('Failed to remove the product');
            }
        },
        error: function (err) {
            console.error('Error:', err);
        }
    });
}




// Function to open the add address modal
function openAddAddressModal() {
    $('#addAddressModal').modal('show');
}

function editAddressModal() {
    $('#editAddressModal').modal('show');
}
// Function to handle form submission
function submitAddressForm() {
    // Validate form fields (you can use additional validation libraries if needed)

    // Get form data
    const formData = {
        fullName: $('#fullName').val(),
        country: $('#country').val(),
        addressLine: $('#addressLine').val(),
        locality: $('#locality').val(),
        city: $('#city').val(),
        state: $('#state').val(),
        pinCode: $('#pinCode').val(),
        phone: $('#phone').val()

    };

    // Perform AJAX POST request to submit the form data
    $.ajax({
        type: 'POST',
        url: '/saveAddress', // Update the URL based on your server route
        data: formData,
        success: function (response) {
            if (response.status === 'success') {
                console.log(response);

                $('#addAddressForm')[0].reset();
                $('#addAddressModal').modal('hide');
            }
        },
        error: function (error) {
            // Handle the error (e.g., show error message, update UI)
            console.error(error);
        }
    });
}

// function to remove an address

function removeAddress(addressId) {
    $.ajax({
        type: 'POST',
        url: '/removeAddress',
        data: { addressId: addressId },
        success: function (response) {
            console.log(response);
            if (response.status === 'success') {
                location.reload();
            }
            else {
                console.log('Failed to remove the Address')
            }

        },
        error: function (error) {
            console.error(error);
        }
    });
}

// function to edit the address to current address details.

function editAddress(addressId) {

    $.ajax({
        type: 'GET',
        url: `/getAddress/${addressId}`, // Replace with your server route to fetch address details
        success: function (response) {
            // Check if the request was successful and data is available
            if (response.status === 'success' && response.address) {
                // Set the current values in the edit form
                const address = response.address;

                $('#editAddressId').val(address._id);
                $('#editFullName').val(address.fullName);
                $('#editCountry').val(address.country);
                $('#editAddressLine').val(address.addressLine);
                $('#editLocality').val(address.locality);
                $('#editCity').val(address.city);
                $('#editState').val(address.state);
                $('#editPinCode').val(address.pinCode);
                $('#editPhone').val(address.phone);

                // Open the edit address modal
                $('#editAddressModal').modal('show');
            } else {
                console.log('Failed to fetch address details');
            }
        },
        error: function (error) {
            console.error(error);
        }
    });
}

//function to edit and submit the edited form

function submitEditAddressForm() {
    // Validate form fields (you can use additional validation libraries if needed)

    // Get form data
    const formData = {
        addressId: $('#editAddressId').val(),
        fullName: $('#editFullName').val(),
        country: $('#editCountry').val(),
        addressLine: $('#editAddressLine').val(),
        locality: $('#editLocality').val(),
        city: $('#editCity').val(),
        state: $('#editState').val(),
        pinCode: $('#editPinCode').val(),
        phone: $('#editPhone').val()
    };

    $.ajax({
        type: 'POST',
        url: '/updateAddress', // Update the URL based on your server route for updating addresses
        data: formData,
        success: function (response) {
            if (response.status === 'success') {
                console.log(response);

                // Close the edit address modal
                $('#editAddressModal').modal('hide');
                location.reload();
            } else {
                console.log('Failed to update the address');
            }
        },
        error: function (error) {
            // Handle the error (e.g., show error message, update UI)
            console.error(error);
        }
    });
}



$(document).ready(function () {
    console.log('Script loaded and executed.');

    $('#placeOrder').on('click', function () {
        const selectedAddress = $('input[name="order-address"]:checked').val();
        const selectedPaymentMethod = $('input[name="paymentMethod"]:checked').val();

        if (!selectedAddress || !selectedPaymentMethod) {
            console.log('Please select both an address and a payment method.');
            return;
        }

        const itemsInCart = [];
        $('.checkout__total__products li').each(function () {
            const cartItem = $(this).data('cart-item');

            if (cartItem && cartItem.product && cartItem.product._id) {
                const productId = cartItem.product._id;
                const productName = cartItem.product.name;
                const quantity = cartItem.quantity;

                itemsInCart.push({ product: { _id: productId, name: productName }, quantity: quantity });
            } else {
                console.error('Invalid cart item:', cartItem);
            }
        });

        const totalPriceText = $('.checkout__total__all li:last span').text().trim();
        const totalPriceOfCart = parseFloat(totalPriceText.replace(/[^\d.]/g, ''));

        if (isNaN(totalPriceOfCart)) {
            console.error('Invalid totalPriceOfCart:', totalPriceOfCart);
            return;
        }

        $.ajax({
            url: '/placeOrder',
            method: 'post',
            contentType: 'application/json',
            data: JSON.stringify({
                addressId: selectedAddress,
                paymentMethod: selectedPaymentMethod,
                itemsInCart: itemsInCart,
                totalPriceOfCart: totalPriceOfCart
            }),
            success: function (response) {
                console.log('AJAX success:', response);
                if (response.codSuccess) {
                    Swal.fire(
                        'Success',
                        'Your order is placed',
                        'success'
                    ).then(() => {
                        location.href = '/orderPlaced'; // Update the redirect URL
                    });
                } else if(response.outOfStock){
                    console.error('AJAX error:', response);
                    Swal.fire(
                        'Sorry',
                        'One or many of the selected products are out of stock',
                        'error'
                    ).then(()=>{
                        location.href ='/cart';
                    });  
                } else{
                    handleRazorpayPayment(response);
                }
            },
            error: function (error) {
                console.error('AJAX request error:', error);
            }
        });
    });
});

    

  
    function handleRazorpayPayment(order) {
        var options = {
            "key": 'rzp_test_bKd6wx7eUIbfAM',
            "amount": order.amount, // Amount should be in paise
            "currency": "INR",
            "name": "Conclave - Fashion Ecommerce",
            "description": "A fashion and Apparel Ecommerce brand",
            "image": "/img/logo.png",
            "order_id": order.id,
            "handler": function (response) {
                verifyPayment(response, order);
            },
            "prefills": {
                "name": "name",
                "email": "abraham@example.com",
                "contact": "9000090000"
            },
            "notes": {
                "address": "Razorpay Corporate Office"
            },
            "theme": {
                "color": "#3399cc"
            }
        };
    
        var rzp1 = new Razorpay(options);
    
        rzp1.on('payment.failed', function (response) {
            console.error('Razorpay Payment Failed Response:', response);
            
        });
    
        rzp1.open();
    }
    

    function verifyPayment(payment, order) {
        $.ajax({
            url: '/verifyPayment',
            method: 'post',
            data: {
                payment: {
                    razorpay_order_id: payment.razorpay_order_id,
                    razorpay_payment_id: payment.razorpay_payment_id,
                    razorpay_signature: payment.razorpay_signature
                },
                order
            },
            success: function (response) {
                console.log('Verification response received:', response);
    
                if (response.status) {
                    console.log('Payment verification successful. Showing success message.');
                    Swal.fire(
                        'Success',
                        'Payment Success, your order is placed',
                        'success'
                    ).then(() => {
                        console.log('Redirecting to orderPlaced page.');
                        location.href = '/orderPlaced';
                    });
    
                } else {
                    console.log('Payment verification failed. Showing error message.');
                    Swal.fire(
                        'Failed',
                        'Payment failed!!!!',
                        'error'
                    ).then(() => {
                        console.log('Redirecting to cart page.');
                        location.href = '/cart';
                    });
                }
            },
            error: function (error) {
                console.error('AJAX request error:', error);
                // You might want to add additional logging or error handling here
            }
        });
    }
    
    












