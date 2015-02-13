/**
 * Rectangle class.  Origin at (x, y), with specified width and height.
 *  bounceTime lets us animate bounciness on intersection.
 */
function Rect(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.x2 = function() { return this.x + this.width };
    this.y2 = function() { return this.y + this.height };
    this.height = height;
    this.width = width;
    this.bounceTime = 0;
}

/**
 * Circle class defines those funky circles that emanate out from
 *  when an intersection happens.
 */
function Circle(x, y, radius, alpha) {
    this.x = x;
    this.y = y;
    this.radius = 40;
    this.alpha = 0.4;
}


/**
 * rectIntersection takes in two rectangle objects and determines whether they intersect.
 *
 * If they intersect, this function returns the rectangle that represents the area they intersect.
 *  Otherwise, it returns null.
 */
function rectIntersection(rectA, rectB) {
    var intersectTop    = Math.max(rectA.y,    rectB.y);
    var intersectRight  = Math.min(rectA.x2(), rectB.x2());
    var intersectBottom = Math.min(rectA.y2(), rectB.y2());
    var intersectLeft   = Math.max(rectA.x,    rectB.x);

    var intersectWidth  = intersectRight - intersectLeft;
    var intersectHeight = intersectBottom - intersectTop;

    if (intersectWidth > 0 && intersectHeight > 0 ) {
        return new Rect(intersectLeft, intersectTop, intersectWidth, intersectHeight);
    }
    return null;
}


/**
 * rectContainsPoint returns true if the specified rectangle contains the point, false otherwise.
 */
function rectContainsPoint(rect, point) {
    if (point.x > rect.x && point.x < rect.x2() &&
        point.y > rect.y && point.y < rect.y2() ) {
        return true;
    }
    return false;
}

// Set up the canvas
var canvas = $("#rect-canvas").get(0);
var canvasWidth = $("#rect-canvas").css("width");
var canvasHeight = $("#rect-canvas").css("height");
var context = canvas.getContext("2d");
canvas.onselectstart = function() { return false; } // Fix weird cursor problems

// Set up mouse listeners
canvas.addEventListener("mousedown", mouseDownListener, false);
canvas.addEventListener("mousemove", mouseMoveListener, false);
canvas.addEventListener("mouseup",   mouseUpListener, false);

// Which rectangle is the user dragging (if any?)
var draggingRect = null;
var draggingTarget = null;
var wasIntersecting = false;

var rect1 = new Rect(10, 10, 50, 50);
var rect2 = new Rect(60, 100, 160, 220);

var circles = [];

/** Draw the specified rect on screen with specified color. */
function drawRect(rect, color) {
    context.fillStyle = color;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
}

function iterateBounciness(rect) {
   var bounceFactor = (Math.sin(rect.bounceTime) + 1) * rect.bounceTime * 0.15;
   if (rect.bounceTime > 0) {
       rect.bounceTime--;
   }

   var bouncedRect = new Rect(0, 0, 0, 0);
   bouncedRect.x = rect.x - bounceFactor;
   bouncedRect.y = rect.y - bounceFactor;
   bouncedRect.width  = rect.width  + bounceFactor * 2;
   bouncedRect.height = rect.height + bounceFactor * 2;
   return bouncedRect;
}

function iterateCircles() {
    console.log(circles.length);
    for (var ndx = circles.length - 1; ndx >= 0; ndx--) {
        circles[ndx].radius += 2;
        circles[ndx].alpha -= 0.03;

        context.beginPath();
        context.arc(circles[ndx].x, circles[ndx].y, circles[ndx].radius, 0, 2*Math.PI, false);
        context.fillStyle = "rgba(255, 255, 255, " + circles[ndx].alpha + ")";
        context.fill();

        if (circles[ndx].alpha < 0) {
            circles.splice(ndx, 1);
        }
    }
}

/**
 * Main animation loop!  Check for intersection, update rectangle
 *  objects, and draw to screen.
 */
function update() {
    requestAnimFrame(update);

    if (draggingRect != null && draggingTarget != null) {
        draggingRect.x += (draggingTarget.x - draggingRect.x) / 2;
        draggingRect.y += (draggingTarget.y - draggingRect.y) / 2;
    }

    var bouncedRect1 = iterateBounciness(rect1);    
    var bouncedRect2 = iterateBounciness(rect2);    

    var intersection = rectIntersection(bouncedRect1, bouncedRect2);
    if (intersection != null && !wasIntersecting) {
        var newCircle = new Circle(intersection.x + intersection.width/2, intersection.y + intersection.height/2);
        circles.push(newCircle);
        wasIntersecting = true;
    }

    if (intersection == null) {
        wasIntersecting = false;
    }

    context.clearRect(0 , 0 , canvas.width, canvas.height);

    drawRect(bouncedRect1, "red");
    drawRect(bouncedRect2, "red");

    if (intersection != null) {
        drawRect(intersection, "green");
    }

    iterateCircles();
}

/**
 * Returns a handy point object in the local coordinate
 *  space of the canvas
 */
function getCanvasCoords(evt) {
    var canvasRect = canvas.getBoundingClientRect();
    var mx = evt.x - canvasRect.left;
    var my = evt.y - canvasRect.top;

    return {x: Math.floor(mx), y: Math.floor(my)};
}

/**
 * Handle user clicking mouse.  If the user just clicked
 *  a rectangle, set it as the rectangle we're dragging.
 */
function mouseDownListener(evt) {
    var mousePoint = getCanvasCoords(evt);

    if (rectContainsPoint(rect1, mousePoint)) {
        draggingRect = rect1;
        rect1.bounceTime = 27;
    }
    else if (rectContainsPoint(rect2, mousePoint)) {
        draggingRect = rect2;
        rect2.bounceTime = 27;
    }

    mouseMoveListener(evt);
}

/**
 * Handle user moving mouse.  Set target drag point to
 *  make rectangle center move towards mouse.
 */
function mouseMoveListener(evt) {
    var mousePoint = getCanvasCoords(evt);

    if (draggingRect != null) {
        draggingTarget = mousePoint;
        draggingTarget.x -= draggingRect.width / 2;
        draggingTarget.y -= draggingRect.height / 2;
    }
}

/**
 * Handle user releasing mouse.  Set target drag point and
 *  drag rectangle to null.
 */
function mouseUpListener(evt) {
    draggingRect = null;
    draggingTarget = null;
}

update();
