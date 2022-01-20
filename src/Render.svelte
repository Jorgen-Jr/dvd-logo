<script>
    import { onMount } from "svelte";
    let files

    let image_src = ''
    let dvd_logo = ''
    let image = ''

    //List of colors to iterate when collision occurs
    const colorList = [
        "blue",
        "red",
        "green",
        "violet",
        "white",
        "purple",
        "yellow",
        "cyan",
        "teal",
        "orange"
    ]

    let isFullscreen = false

    let updateInterval = 10
    let speed = 4

    let currentColor = getRandomColor()

    let y = 1
    let x = 1

    let padding = 8

    let directionY = true
    let directionX = true

    let boundX = 0
    let boundY = 0

    let renderBox = ''
    let dvd = ''

    let size = 150

    let imageLoaded = false

    onMount(() => {
        //Setting up render event
        setInterval(() => {
            //Update image size whenever changed.
            if(!image_src){
                dvd.style.width = `${size}px`
            }

            if(image_src){
                image.style.width = `${size}px`
            }

            //If the user sends an image of his own, convert it and render.
            if(files && !imageLoaded){
                blobToImage(files)

                dvd.style.background = "RGBA(0,0,0,0)"
                dvd.style.height = 'unset'
                dvd.style.width = 'unset'
                
                imageLoaded = true
            }

            render()
        }, (updateInterval));

    })

    function render(){
        //Setting up bounds for collision.
        boundX = renderBox.offsetWidth - dvd.offsetWidth - padding
        boundY = renderBox.offsetHeight - dvd.offsetHeight - padding

        //Colliding on Y axis.
        if(y >= boundY && directionY){
            onCollide("Y")
        }
        else if(y < padding && !directionY){
            onCollide("Y")
        }

        //Colliding on X axis.
        if(x >= boundX && directionX){
            onCollide("X")
        }
        else if(x < padding && !directionX){
            onCollide("X")
        }

        //Setting up the speed and direction of X axis
        if(directionX){
            x = x + 1 * speed 
        }else{
            x = x + 1 * speed * (-1)
        }

        //Setting up the speed and direction of Y axis
        if(directionY){
            y = y + 1 * speed
        }else{
            y = y + 1 * speed * (-1)
        }

        //Setting up logo position on the axis
        dvd.style.left = `${x}px`
        dvd.style.top = `${y}px`
    }

    //Change direction whenever the box collide
    function onCollide(axis){
        switch(axis){
            case "Y":
                directionY = !directionY
                break;
            case "X":
                directionX = !directionX
                break;
        }

        currentColor = getRandomColor()

        dvd_logo.style.fill = currentColor
    }

    function getRandomColor(){
        return colorList[(Math.random()*10 - 1).toFixed(0)]
    }

    //Convert blob sent by user to base64image on the fly.
    function blobToImage(){
        return new Promise(resolve => {
                const url = URL.createObjectURL(files)
                let img = new Image()

                img.onload = () => {
                    URL.revokeObjectURL(url)
                    resolve(img)
                }
                
                image_src = url
            })
    }


</script>

    <div class={isFullscreen ? "isFull":undefined}>
        <span style="font-weight: bolder">Set Your Own Logo: </span>
        <input type="file" accept="image/*" bind:files on:change="{(event) => {
            files = event.target.files[0]
            imageLoaded = false
        }}">
        <br/>

        <span>Speed: {speed}</span>
        <button on:click={() => speed++}>
            Faster
        </button>
        <button on:click={() => speed--}>
            Slower
        </button>
        <br/>

        <span>Size: {size}px</span>
        <button on:click={() => size = size + 5}>
            Bigger
        </button>
        <button on:click={() => size = size - 5}>
            Smaller
        </button>
        <br/>
        
        <button on:click={() => {
                isFullscreen = !isFullscreen
                if(isFullscreen){
                    renderBox.style.position = "absolute"
                    renderBox.style.top = 0
                    renderBox.style.left = 0
                    renderBox.style.marginBottom = 0
                    document.getElementsByTagName("body")[0].style.overflow = "hidden"
                }else{
                    renderBox.style.position = "relative"
                    document.getElementsByTagName("body")[0].style.overflow = "unset"
                }
            }}>
            Toogle Fullscreen
        </button>

    </div>

    <div id="renderBox" bind:this={renderBox}>
        <div id="dvd" bind:this={dvd}>
            {#if image_src}
                <img bind:this={image} src={image_src} alt="Custom Logo Sent by User" />
            {:else}
            <svg id="dvd_logo" bind:this={dvd_logo} xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 210 107">
                <title>DVD logo</title>
                <path d="M118.895,20.346c0,0-13.743,16.922-13.04,18.001c0.975-1.079-4.934-18.186-4.934-18.186s-1.233-3.597-5.102-15.387H81.81H47.812H22.175l-2.56,11.068h19.299h4.579c12.415,0,19.995,5.132,17.878,14.225c-2.287,9.901-13.123,14.128-24.665,14.128H32.39l5.552-24.208H18.647l-8.192,35.368h27.398c20.612,0,40.166-11.067,43.692-25.288c0.617-2.614,0.53-9.185-1.054-13.053c0-0.093-0.091-0.271-0.178-0.537c-0.087-0.093-0.178-0.722,0.178-0.814c0.172-0.092,0.525,0.271,0.525,0.358c0,0,0.179,0.456,0.351,0.813l17.44,50.315l44.404-51.216l18.761-0.092h4.579c12.424,0,20.09,5.132,17.969,14.225c-2.29,9.901-13.205,14.128-24.75,14.128h-4.405L161,19.987h-19.287l-8.198,35.368h27.398c20.611,0,40.343-11.067,43.604-25.288c3.347-14.225-11.101-25.293-31.89-25.293h-18.143h-22.727C120.923,17.823,118.895,20.346,118.895,20.346L118.895,20.346z"/><path d="M99.424,67.329C47.281,67.329,5,73.449,5,81.012c0,7.558,42.281,13.678,94.424,13.678c52.239,0,94.524-6.12,94.524-13.678C193.949,73.449,151.664,67.329,99.424,67.329z M96.078,85.873c-11.98,0-21.58-2.072-21.58-4.595c0-2.523,9.599-4.59,21.58-4.59c11.888,0,21.498,2.066,21.498,4.59C117.576,83.801,107.966,85.873,96.078,85.873z"/><polygon points="182.843,94.635 182.843,93.653 177.098,93.653 176.859,94.635 179.251,94.635 178.286,102.226 179.49,102.226 180.445,94.635 182.843,94.635"/><polygon points="191.453,102.226 191.453,93.653 190.504,93.653 187.384,99.534 185.968,93.653 185.013,93.653 182.36,102.226 183.337,102.226 185.475,95.617 186.917,102.226 190.276,95.617 190.504,102.226 191.453,102.226"/></svg>
            {/if}
            </div>
    </div>

<style>
    #renderBox{
        background: black;
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 1;
    }
    #dvd{
        position: absolute;
        top: 0;
        left: 0;
    }
    .isFull{
        position: relative;
        color: white;
        opacity: 0;
        z-index: 2;
        transition: 0.2s;
    }
    .isFull:hover{
        z-index: 2;
        opacity: 1;
    }
    #dvd_logo{
        fill: red;
    }
</style>