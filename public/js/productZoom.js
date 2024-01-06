
    $(document).ready(function() {
        // Apply Elevate Zoom to each image with the .zoom class
        $('.zoom').each(function(index) {
            const tabId = $(this).closest('.tab-pane').attr('id');
            const galleryId = `gallery-${tabId}-${index}`; // Unique gallery ID for each image

            $(this).elevateZoom({
                zoomType: 'inner',
                cursor: 'crosshair',
                responsive: true,
                gallery: galleryId, // Use the unique gallery ID for each image
                galleryActiveClass: 'active',
                scrollZoom: false,
                borderSize: 0,
                zoomWindowFadeIn: 500,
                zoomWindowFadeOut: 500
            });
        });
    });

