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
    const prevSelectedButton = document.querySelector(".size-box.selected");
    if (prevSelectedButton) {
        prevSelectedButton.classList.remove("selected");
    }

    // Update the selected size
    selectedSize = size;

    // Toggle the style for the selected button
    const selectedButton = event.currentTarget;
    selectedButton.classList.add("selected");
}

function addToCart(productId) {
    // Check if a size is selected
    

    // Perform AJAX request with the selected size
    $.ajax({
      url: `/add-to-cart/${productId}?size=${selectedSize}`,
        method: "GET", 
        success: (response) => {
            if (response.status) {
                Swal.fire("Added!", "Product added to cart", "success").then(() => {
                    window.location.href = "/cart";
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "You need to login",
                    footer: '<a href="/">Click here to Login</a>',
                });
            }
        },
        error: (err) => {
            console.error("Error:", err);
        },
    });
}

function selectSizeAndAddToCart(productId) {
  if (!selectedSize) {
    alert("Please select a size.");
    return;
  }

  // Call addToCart function with productId and selectedSize
  addToCart(productId, selectedSize);
}






// Ajax to change the quantity in the cart

// Plus button click event
$(".plus-btn").on("click", function () {
  const itemId = $(this).data("itemid");
  const currentItemQuantity = parseInt($("#" + itemId).text());
  const currentStockCount = parseInt($("#" + itemId + "-stock").text());

  // Check if the current quantity is less than the stock count
  if (currentItemQuantity < currentStockCount) {
      changeQuantity(itemId, "1");
  }

  // Disable plus button and show message if current quantity exceeds stock count by one
  if (currentItemQuantity + 1 > currentStockCount) {
      $(this).prop("disabled", true);
      $("#" + itemId + "-message").text("Out of stock or insufficient stock.");
  } else {
      $("#" + itemId + "-message").text(""); // Clear the message if quantity is within stock count
  }

  // Enable minus button
  $(".minus-btn").prop("disabled", false);
});

// Minus button click event
$(".minus-btn").on("click", function () {
  const itemId = $(this).data("itemid");
  changeQuantity(itemId, "-1");
  $(".plus-btn").prop("disabled", false);
});

// Function to change quantity via AJAX
function changeQuantity(itemId, quantityChange) {
  $.ajax({
      type: "POST",
      url: "/changeQuantity",
      data: {
          itemId: itemId,
          quantityChange: quantityChange,
      },
      success: function (response) {
          if (response.status === "success") {
              // Update the displayed quantity
              $("#" + itemId).text(response.quantity);
              // Update total price per item
              $("#total" + itemId).text(response.price);
              // Update the cart total
              $("#grandTotal").text(response.totalPrice);
          }
      },
      error: function (err) {
          console.error("Error:", err);
      },
  });
}



// To remove the product from the cart

// Remove button click event
$(".remove-btn").on("click", function () {
  const itemId = $(this).data("itemid");
  removeProduct(itemId);
});

function removeProduct(itemId) {
  $.ajax({
    type: "POST",
    url: "/removeProduct/" + itemId,
    success: function (response) {
      if (response.status === "success") {
        // Remove the item from the page
        $("#item" + itemId).remove(); // Adjust the selector to match your HTML structure
        location.reload(); // Refresh the page to reflect the updated cart
      } else {
        console.log("Failed to remove the product");
      }
    },
    error: function (err) {
      console.error("Error:", err);
    },
  });
}

// Function to open the add address modal
function openAddAddressModal() {
  $("#addAddressModal").modal("show");
}

function editAddressModal() {
  $("#editAddressModal").modal("show");
}
// Function to handle form submission
function submitAddressForm() {
  // Validate form fields (you can use additional validation libraries if needed)

  // Get form data
  const formData = {
    fullName: $("#fullName").val(),
    country: $("#country").val(),
    addressLine: $("#addressLine").val(),
    locality: $("#locality").val(),
    city: $("#city").val(),
    state: $("#state").val(),
    pinCode: $("#pinCode").val(),
    phone: $("#phone").val(),
  };

  // Perform AJAX POST request to submit the form data
  $.ajax({
    type: "POST",
    url: "/saveAddress", // Update the URL based on your server route
    data: formData,
    success: function (response) {
      if (response.status === "success") {
        console.log(response);

        $("#addAddressForm")[0].reset();
        $("#addAddressModal").modal("hide");
      }
    },
    error: function (error) {
      // Handle the error (e.g., show error message, update UI)
      console.error(error);
    },
  });
}

// function to remove an address

function removeAddress(addressId) {
  $.ajax({
    type: "POST",
    url: "/removeAddress",
    data: { addressId: addressId },
    success: function (response) {
      console.log(response);
      if (response.status === "success") {
        location.reload();
      } else {
        console.log("Failed to remove the Address");
      }
    },
    error: function (error) {
      console.error(error);
    },
  });
}

// function to edit the address to current address details.

function editAddress(addressId) {
  $.ajax({
    type: "GET",
    url: `/getAddress/${addressId}`, // Replace with your server route to fetch address details
    success: function (response) {
      // Check if the request was successful and data is available
      if (response.status === "success" && response.address) {
        // Set the current values in the edit form
        const address = response.address;

        $("#editAddressId").val(address._id);
        $("#editFullName").val(address.fullName);
        $("#editCountry").val(address.country);
        $("#editAddressLine").val(address.addressLine);
        $("#editLocality").val(address.locality);
        $("#editCity").val(address.city);
        $("#editState").val(address.state);
        $("#editPinCode").val(address.pinCode);
        $("#editPhone").val(address.phone);

        // Open the edit address modal
        $("#editAddressModal").modal("show");
      } else {
        console.log("Failed to fetch address details");
      }
    },
    error: function (error) {
      console.error(error);
    },
  });
}

//function to edit and submit the edited form

function submitEditAddressForm() {
  // Validate form fields (you can use additional validation libraries if needed)

  // Get form data
  const formData = {
    addressId: $("#editAddressId").val(),
    fullName: $("#editFullName").val(),
    country: $("#editCountry").val(),
    addressLine: $("#editAddressLine").val(),
    locality: $("#editLocality").val(),
    city: $("#editCity").val(),
    state: $("#editState").val(),
    pinCode: $("#editPinCode").val(),
    phone: $("#editPhone").val(),
  };

  $.ajax({
    type: "POST",
    url: "/updateAddress", // Update the URL based on your server route for updating addresses
    data: formData,
    success: function (response) {
      if (response.status === "success") {
        console.log(response);

        // Close the edit address modal
        $("#editAddressModal").modal("hide");
        location.reload();
      } else {
        console.log("Failed to update the address");
      }
    },
    error: function (error) {
      // Handle the error (e.g., show error message, update UI)
      console.error(error);
    },
  });
}


$(document).ready(function () {
  console.log("Script loaded and executed.");

  $("#placeOrderWallet").on("click", function () {
      const selectedAddress = $('input[name="order-address"]:checked').val();
      const useWallet = $('#useWallet').is(":checked"); // Check if the wallet is selected

      if (!selectedAddress) {
          console.log("Please select an address.");
          return;
      }

      const itemsInCart = [];
      $(".checkout__total__products li").each(function () {
          const cartItem = $(this).data("cart-item");

          if (cartItem && cartItem.product && cartItem.product._id) {
              const productId = cartItem.product._id;
              const size = cartItem.size;
              const quantity = cartItem.quantity;

              itemsInCart.push({
                  product: { _id: productId },
                  size: size,
                  quantity: quantity,
              });
          } else {
              console.error("Invalid cart item:", cartItem);
          }
      });

      $.ajax({
          url: "/placeOrderUsingWallet",
          method: "post",
          contentType: "application/json",
          data: JSON.stringify({
              addressId: selectedAddress,
              itemsInCart: itemsInCart,
              useWallet: useWallet // Include useWallet in the request body
          }),
          success: function (response) {
              console.log("AJAX success:", response);
              if (response.orderPlaced) {
                  // Redirect to the order placement page
                  window.location.href = "/orderPlaced";
                  // Display SweetAlert for successful order placement
                  Swal.fire({
                      icon: 'success',
                      title: 'Order Placed!',
                      text: 'Your order has been successfully placed.',
                  });
              } else {
                  // Handle other cases if needed
                  Swal.fire({
                      icon: 'error',
                      title: 'Error!',
                      text: 'Failed to place the order. Please try again later.',
                  });
              }
          },
          error: function (error) {
              console.error("AJAX request error:", error);
              // Display SweetAlert for AJAX request error
              Swal.fire({
                  icon: 'error',
                  title: 'Error!',
                  text: 'Failed to place the order due to a network error. Please try again later.',
              });
          },
      });
  });
});



$(document).ready(function () {
  console.log("Script loaded and executed.");

  $("#placeOrder").on("click", function () {
      const selectedAddress = $('input[name="order-address"]:checked').val();
      const selectedPaymentMethod = $('input[name="paymentMethod"]:checked').val();
      const useWalletChecked = $("#useWallet").is(":checked"); // Check if useWallet checkbox is checked

      if (!selectedAddress || !selectedPaymentMethod) {
          console.log("Please select both an address and a payment method.");
          return;
      }

      const itemsInCart = [];
      $(".checkout__total__products li").each(function () {
          const cartItem = $(this).data("cart-item");

          if (cartItem && cartItem.product && cartItem.product._id) {
              const productId = cartItem.product._id;
              const size = cartItem.size;
              const quantity = cartItem.quantity;

              itemsInCart.push({
                  product: { _id: productId },
                  size: size,
                  quantity: quantity,
              });
          } else {
              console.error("Invalid cart item:", cartItem);
          }
      });

      let url = "";
      if (selectedPaymentMethod === "COD") {
          url = "/placeOrderCOD";
      } else if (selectedPaymentMethod === "onlinePayment") {
          url = "/placeOrderOnline";
      }

      $.ajax({
          url: url,
          method: "post",
          contentType: "application/json",
          data: JSON.stringify({
              addressId: selectedAddress,
              itemsInCart: itemsInCart,
              walletChecked: useWalletChecked // Include walletChecked parameter
          }),
          success: function (response) {
              console.log("AJAX success:", response);
              if (selectedPaymentMethod === "COD") {
                  handleResponse(response, "COD");
              } else if (selectedPaymentMethod === "onlinePayment") {
                  handleResponse(response, "onlinePayment");
              }
          },
          error: function (error) {
              console.error("AJAX request error:", error);
          },
      });
  });
});

function handleResponse(response, paymentMethod) {
  if (paymentMethod === "COD") {
      if (response.orderPlaced) {
          Swal.fire("Success", "Your order is placed", "success").then(() => {
              location.href = "/orderPlaced"; // Update the redirect URL
          });
      } else if (response.outOfStock) {
          console.error("AJAX error:", response);
          Swal.fire(
              "Sorry",
              "One or many of the selected products are out of stock",
              "error"
          ).then(() => {
              location.href = "/cart";
          });
      } else if (response.status === "error") {
          Swal.fire("Error", response.message || "An error occurred", "error");
      }
  } else if (paymentMethod === "onlinePayment") {
      if (response.razorpayOrder && response.orderData) {
          response.orderData.payable_amount = response.orderData.payable_amount / 100; // Convert payable_amount back to rupees
          handleRazorpayPayment(response);
      } else if (response.outOfStock) {
          console.error("AJAX error:", response);
          Swal.fire(
              "Sorry",
              "One or many of the selected products are out of stock",
              "error"
          ).then(() => {
              location.href = "/cart";
          });
      } else {
          Swal.fire("Error", response.message || "An error occurred", "error");
      }
  }
}

function handleRazorpayPayment(response) {
  var options = {
      key: "rzp_test_bKd6wx7eUIbfAM", // Replace with your Razorpay API key
      amount: response.orderData.payable_amount * 100, // Amount should be in paise
      currency: "INR",
      name: "Conclave - Fashion Ecommerce",
      description: "A fashion and Apparel Ecommerce brand",
      image: "/img/logo.png",
      order_id: response.razorpayOrder.id, // Use the Razorpay order ID
      handler: function (response) {
          verifyPayment(response, response.orderData, response.order); // Pass orderData and order to verifyPayment
      },
      prefills: {
          name: "name", // Replace with the customer's name
          email: "abraham@example.com", // Replace with the customer's email
          contact: "9000090000", // Replace with the customer's contact number
      },
      notes: {
          address: "Razorpay Corporate Office",
      },
      theme: {
          color: "#3399cc",
      },
  };

  var rzp1 = new Razorpay(options);

  rzp1.on("payment.failed", function (response) {
      console.error("Razorpay Payment Failed Response:", response);

      Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "Sorry, your payment failed. Please try again or choose a different payment method.",
      }).then(() => {
          // Redirect to cart page
          location.href = "/checkout";
      });
  });

  rzp1.open();
}

function verifyPayment(response, orderData, order) {
  $.ajax({
      url: "/verifyPayment",
      method: "post",
      contentType: "application/json", // Set content type to JSON
      data: JSON.stringify({
          payment: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
          },
          orderData: orderData, // Include orderData in the request body
          order: order, // Include order in the request body
      }),
      success: function (result) {
          if (result.status === 'success') {
              // Show SweetAlert for success
              Swal.fire({
                  icon: 'success',
                  title: 'Payment Verified',
                  text: 'Your payment was successfully verified.',
                  showConfirmButton: false,
                  timer: 1500
              }).then(() => {
                  // Redirect to orderPlaced page
                  window.location.href = result.redirect;
              });
          } else {
              // Show SweetAlert for error
              Swal.fire({
                  icon: 'error',
                  title: 'Payment Verification Failed',
                  text: 'There was an error verifying your payment. Please try again or contact support.',
                  showConfirmButton: false,
                  timer: 3000
              }).then(() => {
                  // Redirect to cart page
                  window.location.href = result.redirect;
              });
          }
      },
      error: function (error) {
          console.error("AJAX request error:", error);
          // Show SweetAlert for error and redirect to cart page
          Swal.fire({
              icon: 'error',
              title: 'Payment Verification Failed',
              text: 'There was an error verifying your payment. Please try again or contact support.',
              showConfirmButton: false,
              timer: 3000
          }).then(() => {
              // Redirect to cart page
              window.location.href = '/cart';
          });
      },
  });
}



// Apply Coupon AJAX Function
$("#apply-coupon").click(function () {
  var couponCode = $("#coupon-code").val();
  $.ajax({
      type: "POST",
      url: "/applyCoupon",
      data: { code: couponCode },
      success: function (response) {
          if (response.success) {
              // Apply the discount to the total
              var newTotal = response.newTotal;
              var discount = response.discount;
      
              // Update UI with new values
              $("#total").text("₹ " + newTotal);
              $("#discount").text("- ₹ " + discount);
              $("#amountToBePaidValue").text("₹ " + newTotal); // Update amount to be paid
              
              Swal.fire(
                  'Success',
                  'Coupon applied!',
                  'success'
              );
      
              $("#myDiv").show();
          } else {
              // Handle other cases
              if (response.notapplicable) {
                  Swal.fire({
                      icon: 'error',
                      title: 'Oops...',
                      text: "Can't apply the coupon! Check cart total and coupon conditions.",
                  });
              } else if (response.expired) {
                  Swal.fire({
                      icon: 'error',
                      title: 'Oops...',
                      text: 'Coupon expired!',
                  });
              } else {
                  Swal.fire({
                      icon: 'error',
                      title: 'Oops...',
                      text: 'Invalid coupon code or you have already applied this coupon!',
                  });
              }
          }
      },
      error: function (err) {
          console.error("Error applying coupon:", err);
          Swal.fire({
              icon: "error",
              title: "Error",
              text: "An error occurred while applying the coupon.",
          });
      },
  });
});


// Remove Coupon AJAX Function
$("#removeCoupon").click(function () {
  var couponCode = $("#coupon-code").val();
  $.ajax({
      type: "POST",
      url: "/removeCoupon",
      data: { code: couponCode },
      success: function (response) {
          if (response.success) {
              // Apply the discount to the total
              var newTotal = response.newTotal;
              var discount = response.discount;

              // Update UI with new values or set back to 0 when coupon is removed
              $("#total").text("₹ " + (newTotal || totalPriceOfCart));
              $("#discount").text("- ₹ " + (discount || 0));
              $("#amountToBePaidValue").text("₹ " + (newTotal || totalPriceOfCart)); // Update amount to be paid
              
              Swal.fire(
                  'Success',
                  'Coupon removed',
                  'success'
              );
              $("#myDiv").hide();
              document.getElementById("coupon-code").value = "";
          } else {
              Swal.fire({
                  icon: 'error',
                  title: 'Oops...',
                  text: 'Something went wrong while removing applied coupon!',
              });
          }
      },
  });
});



function selectSizeAndAddToWishlist(productId) {
  const selectedSize = $('.size-box.selected').text().trim();
  if (!selectedSize) {
      alert("Please select a size.");
      return;
  }
  addToWishlist(productId, selectedSize);
}

function addToWishlist(productId, selectedSize) {
  $.ajax({
      url: `/add-to-wishlist/${productId}?size=${selectedSize}`,
      method: "GET",
      success: (response) => {
          console.log(response); // Debugging: Log response from server
          if (response.status) {
            
              Swal.fire({
                  icon: "success",
                  title: "Added!",
                  text: "Product added to wishlist",
              }).then(() => {
                  window.location.href = '/wishlist';
              });
          } else {
              Swal.fire({
                  icon: "error",
                  title: "Oops...",
                  text: response.message,
                  footer: '<a href="/">Click here to Login</a>',
              });
          }
      },
      error: (err) => {
          console.error("Error:", err); // Debugging: Log any errors
      },
  });
} 


function removeProductFromWishlist(wishlistId, productId) {
  $.ajax({
    type: 'POST',
    url: `/remove-from-wishlist/${wishlistId}/${productId}`,
    contentType: 'application/json',
    success: function (response) {
      if (response.status) {
        Swal.fire(
          'Removed!',
          'Product removed from wishlist',
          'success'
        );
        // Remove the product from the DOM
        $('#' + productId + 'item').remove();
      } else {
        console.error('Failed to remove product from wishlist');
      }
    },
    error: function (err) {
      console.error('Failed to remove product from wishlist', err);
    }
  });
}

//Add to cart from the wishlist:

function AddToCart(productId, size) {
  $.ajax({
    url: `/add-to-cart/${productId}?size=${size}`,
    method: "GET",
    success: (response) => {
      console.log(response);
      if (response.status) {
        // removeProductFromWishlisttoAddtoCart(productId)
        Swal.fire("Added!", "Product added to cart", "success").then(() => {
          window.location.href = '/cart';
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: response.message,
          footer: '<a href="/">Click here to Continue Shopping</a>',
        });
      }
    },
    error: (err) => {
      console.error("Error:", err);
    },
  });
}

// function removeProductFromWishlisttoAddtoCart(productId){
//   $.ajax({
//     type:'POST',
//     url:`/remove-product-from-wishlist-to-addToCart/${productId}`,
//     contentType: 'application/json',
//     success: function (response) {
//       if (response.status) {
//         console.log('Product removed from wishlist');
//         // Remove the corresponding HTML element from the DOM
//         $('#' + productId + 'item').remove();
//         // Optionally, fetch updated wishlist data here and update the UI
//         // fetchUpdatedWishlistData();
//       } else {
//         console.error('Failed to remove product from wishlist');
//       }
//     },
//     error: function (err) {
//       console.error('Failed to remove product from wishlist', err);
//     }
//   });
// }

