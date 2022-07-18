L.mapbox.accessToken = 'pk.eyJ1Ijoia3VsaW9uZXIiLCJhIjoiY2tuNTB1YXhnMDg3dDJ1cDh0aHRmNmc5diJ9.0D_Jj39P9DYUQ0oP2kyFOg';

App = {

    socket : io('https://tletolatlng.herokuapp.com/'), //io('localhost:5000'),io('https://tletolatlng.herokuapp.com/')
    tleList : {},
    geo_cords : {},
    current_sat : null,
    tooltipTriggerList : [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')),
    state : {
        is_menu_open : true,
        is_starting : true,
        is_draw_starting : true,
        is_tracking : false,
        viewer : 'flat',
    },
    interval : {
        showKM : null,
    },
    container : {
        loading : document.getElementById('loading'),
        menu : document.querySelector('.menu'),
        quickBtns : document.querySelector('.btns'),
        kmDisplay : document.getElementById('km'),
        cordsDisplay : {
            wrapper : document.getElementById('cord_tart'),
            body : document.getElementById('cord')
        },
        wikiModal : {
            modal : new bootstrap.Modal(document.getElementById('modal')),
            title : document.getElementById('wiki_title'),
            body  : document.getElementById('wiki_modal'),
        }
    },
    button : {

    },
    input : {
        selectSatellite : document.getElementById('sat_select'),
        customTLE : document.getElementById('custom_tle'),
    },
    viewer : {
        flat : document.getElementById('map'),
        globe : document.getElementById('three_map')
    },


    map : L.map('map',{
            center : [30.313445, 3.212532],
            zoom : 3,
            minZoom: 2,
            maxBounds : [[85, -180],[-85, 180]]
            })
            .addLayer(L.mapbox.styleLayer('mapbox://styles/kulioner/ckyx4j4u8006d15ldk73bk5gl',{
                continuousWorld : true,  
            })),
    sat_popup : L.popup([],{
        closeButton: false,
        }),
    sat_icon : L.icon({
        iconUrl: '#',
        iconSize: [50, 50],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
    }),
    sat_marker : L.marker([-85, 180],{
        alt : 'Satellite Marker',
        opacity: 0
    }),
    sat_user_line : L.polyline([],{color:'blue'}),
    sat_track_lines : {
        previous : L.polyline([],{color:'orange'}),
        current : L.polyline([],{color:'red'}),
        next : L.polyline([],{color:'green'})
    },
    user_field_of_view_line : L.circle([], 48280.3,{color : 'white',title:'Field of view'}),
   

    init : ()=>{

        window.sat_is_changed = window.current_sat = false;
    
        App.resize();
        
        fetch('./src/json/tle_list.json')
        .then(res => res.json())
        .then(json =>{

            App.tleList = window.tles = json;
            
            for(let i in App.tleList){
                if(i !=  'UNKNOWN'){
                    App.input.selectSatellite.innerHTML += "<option value='"+i+"'>"+ App.tleList[i].has3D +" &nbsp;"+i.toUpperCase()+"</option>";
    
                }
            }

        });


        App.tooltipList = App.tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl,{
                boundary: document.body
            });;
            });
        
        App.tooltipTriggerList.forEach(e=>{
            e.addEventListener('click',()=>{
                App.tooltipList.forEach(t =>{
                    t.hide();
                });
            })
        })

        
        App.sat_marker.setIcon(App.sat_icon);
        App.sat_marker.bindPopup(App.sat_popup);
        App.sat_marker.addTo(App.map);

        App.sat_marker.addEventListener('mouseover',()=>{
            App.sat_marker.openPopup();
        });
        App.sat_marker.addEventListener('mouseout',()=>{
            App.sat_marker.closePopup();
        });


        App.socket.on('send',App.renderMapData);
        App.socket.on('tleError',App.tleErrorHandler);
        App.socket.on('sendTrack',App.renderSatelliteTrack);
        window.addEventListener('resize',App.resize,false);
        App.input.selectSatellite.addEventListener('change',App.changeSatellite,false);
        App.input.customTLE.addEventListener('keydown',App.getCustomSatellite,false);
        document.getElementById('get_pos').addEventListener('click',App.getPosition,false);
        document.getElementById('info').addEventListener('click',App.getWiki,false);
    },


    toggleMenu : ()=>{

        switch(App.state.is_menu_open){
            case true:
            App.container.menu.style.transform = 'translate(-100%)';
            App.state.is_menu_open = false;
                break;
            case false:
            App.container.menu.style.transform = 'translate(0%)';
            App.state.is_menu_open = true;
                break
        }
    },

    resize : ()=>{
        App.container.loading.style.width = window.innerWidth + 'px';
        App.container.loading.style.height = window.innerHeight + 'px';
        App.viewer.flat.style.width = (window.innerWidth + 30) + "px";
        App.viewer.flat.style.height = (window.innerHeight + 30) + "px";
        App.map.invalidateSize();
    },
    changeViewer : (state)=>{

        switch(state){
            case 'flat':
                App.viewer.globe.style.display = 'none';
                App.viewer.flat.style.display = 'block';
                App.state.viewer = 'flat';
                break;
            case 'globe':
                App.viewer.flat.style.display = 'none';
                App.viewer.globe.style.display = 'block';
                App.state.viewer = 'globe';
                break;
        }
        App.resize();

    },

    centralizeMap : ()=>{
        App.map.setView(App.geo_cords.sat,9);
    },
    toggleTracking2D : ()=>{

        if(App.state.is_tracking){
            App.state.is_tracking = false;
            document.querySelector('.fa-crosshairs').classList.remove('tracking');
            document.querySelector('.fa-crosshairs').title = 'Tracking is OFF!';
        }else{
            App.state.is_tracking = true;
            document.querySelector('.fa-crosshairs').classList.add('tracking');
            document.querySelector('.fa-crosshairs').title = 'Tracking is ON!';
        }

    },
    changeSatellite : (tle = null)=>{

        if(App.input.selectSatellite.value != null){

            App.container.wikiModal.modal.hide();
            App.container.loading.style.display = 'block';
            App.state.is_starting = true;
            document.getElementById('info').classList.remove('disabled');
            App.socket.emit('get',App.tleList[App.input.selectSatellite.value].tle);
            window.current_sat = App.input.selectSatellite.value;

        }
        else{
            App.quickBtns.style.display = 'none';
            App.container.cordsDisplay.wrapper.style.display = 'none';
        }
        if(App.geo_cords.user != undefined){
            App.removeLine();
        }
    },
    getCustomSatellite : (e)=>{

        if(e.keyCode == 13){

            let tle = App.input.customTLE.value.trim();
        
            if(tle != "" && tle != null){
                
                App.container.wikiModal.modal.hide();
                App.container.loading.style.display = 'block';
                App.state.is_starting = true;
                document.getElementById('info').classList.add('disabled');
    
                App.socket.emit('get',tle);
                window.current_sat = 'UNKNOWN';
                
            }
    
        }
        
    },
    getWiki : ()=>{

        

        if(window.current_sat != 'UNKNOWN'){

            App.container.loading.style.display = 'block';
            
            //let url = "https://en.wikipedia.org/w/api.php?&origin=*&action=parse&format=json&section=0&page="+App.tleList[window.current_sat].wiki+"&callback=?/";
            let url = "https://en.wikipedia.org/api/rest_v1/page/summary/"+ App.tleList[window.current_sat].wiki;
            fetch(url)
            .then(response => response.json())
            .then( json => {
                
                App.container.wikiModal.title.innerHTML = "<a target='_blank' href='https://en.wikipedia.org/wiki/"+App.tleList[window.current_sat].wiki+"' >"+window.current_sat.toUpperCase()+"</a>";
                App.container.wikiModal.body.innerHTML = json.extract_html;
                App.container.wikiModal.modal.show();
                App.container.loading.style.display = 'none';
            })
            .catch(err => {
                console.error("Fetch from Wikipedia",err);
                App.container.loading.style.display = 'none';
            })

        }else{
            App.oneError('Sorry!','<h3>We can only prived more information about built-in satellites.</h3>')
        }
        

        

    
        

    },
    renderMapData : (data)=>{

        App.geo_cords.sat = [
            data.cords.lat,
            data.cords.lng
        ];

        window.sat_cords = {
            lat : data.cords.lat,
            lng : data.cords.lng
        }

        if(App.state.is_starting){

            window.sat_is_changed = true;

            App.sat_icon = L.icon({
                iconUrl : './src/images/satellites/'+window.current_sat+".png",
                iconSize : [100,100]
            });

            
            App.sat_marker.setIcon(App.sat_icon);
            App.sat_marker.setLatLng(App.geo_cords.sat);
            App.sat_marker.setOpacity(1);
            App.sat_marker.update();

            App.sat_popup.setContent("<h1 class='mapPopup'>"+window.current_sat.toUpperCase()+"</h1>");

            App.container.cordsDisplay.body.innerHTML = "Lat: "+ App.geo_cords.sat[1].toFixed(10) +" | Lng: "+App.geo_cords.sat[0].toFixed(10);
        
                    App.map.on('mouseenter','satellite',(e)=>{
                        let cords = e.features[0].geometry.coordinates.slice();
                        let desc = e.features[0].properties.description;
    
                        App.map_popup.setLngLat(cords).setHTML(desc).addTo(App.map);
                    });
                    App.map.on('mouseleave','satellite',(e)=>{
                        App.map_popup.remove();
                    });
    
                    
                    App.map.setView(App.geo_cords.sat,6)
    
                    App.state.is_starting = false;
                    App.container.quickBtns.style.display = 'block';
                    App.container.cordsDisplay.wrapper.style.display = 'block';
                    App.container.loading.style.display = 'none';
                    
        }else{

            App.sat_marker.setLatLng(App.geo_cords.sat);
            App.sat_marker.update();
            App.container.cordsDisplay.body.innerHTML = "Lat: "+ App.geo_cords.sat[1].toFixed(10) +" | Lng: "+App.geo_cords.sat[0].toFixed(10); 

            if(App.state.is_tracking){
                App.map.setView(App.geo_cords.sat);
            }
        
        }

    },
    getPosition : ()=>{
        App.container.kmDisplay.innerHTML = "Calculating...";
        App.container.kmDisplay.style.display = 'block';
        try{
            if(navigator.geolocation){

            navigator.geolocation.getCurrentPosition(pos=>{
            
                App.geo_cords.user = [ pos.coords.latitude, pos.coords.longitude ];
                App.interval.showKM = setInterval(App.drawLine,1000);
                document.getElementById('get_pos').removeEventListener('click',App.getPosition);
                document.getElementById('get_pos').addEventListener('click',App.removeLine);

            },()=>{
                App.container.kmDisplay.innerHTML = "";
                alert('For this future, turn on the GPS and enable GEOLOCATION!');
            })  
        }else{
            alert('Your device not support Geolocation features!:(')
        }
        }catch(err){
            App.container.kmDisplay.innerHTML = "";
            if(err) throw err;
            
        }

    },
    drawLine : ()=>{

        
        if(App.state.is_draw_starting){

            App.sat_user_line.setLatLngs([App.geo_cords.user,App.geo_cords.sat]).addTo(App.map);
            App.state.is_draw_starting = false;

            App.user_field_of_view_line.setLatLng(App.geo_cords.user).addTo(App.map);

        }else{

            App.sat_user_line.setLatLngs([App.geo_cords.user,App.geo_cords.sat]);
            App.container.kmDisplay.innerHTML = turf.length(App.sat_user_line.toGeoJSON()).toLocaleString() + ' km';
            
        }

    },
    removeLine : ()=>{

        App.container.kmDisplay.innerHTML = "";
        App.sat_user_line.remove();
        App.user_field_of_view_line.remove();
        clearInterval(App.interval.showKM);
        document.getElementById('get_pos').removeEventListener('click',App.removeLine);
        document.getElementById('get_pos').addEventListener('click',App.getPosition);
        App.container.kmDisplay.style.display ='none';
        App.state.is_draw_starting = true;

    },
    renderSatelliteTrack : (data)=>{

        data.forEach(e=>{
            e.pop();
        });

        window.sat_orbits = data;

        try{

        App.sat_track_lines.previous.setLatLngs(data[0]).addTo(App.map);
        App.sat_track_lines.current.setLatLngs(data[1]).addTo(App.map);
        App.sat_track_lines.next.setLatLngs(data[2]).addTo(App.map);

        }catch(err){
            App.clearScreen();
            App.oneError('Orbit Error','<h3>An error occurred while processing the orbit data.</h3>');
        }
        
        

    },
    clearScreen : ()=>{

        App.container.loading.style.display = 'none';
        App.container.kmDisplay.style.display ='none';
        App.quickBtns.style.display = 'none';
        App.container.cordsDisplay.wrapper.style.display = 'none';
        App.state.is_starting = true;
        Object.keys(App.sat_track_lines).forEach(e=>App.sat_track_lines[e].remove());

    },
    oneError : (title,message)=>{

        App.container.wikiModal.title.innerHTML = title
        App.container.wikiModal.body.innerHTML = message;
        App.container.wikiModal.modal.show();

    },
    tleErrorHandler : (err)=>{

        console.log('ServerSide:',err);
        App.sat_marker.setOpacity(0);
        App.sat_marker.update();
        App.clearScreen();
        App.oneError('TLE Error!',`<h3>An error occurred while processing the TLE.</h3>`);
        
    }
    


}

window.addEventListener('DOMContentLoaded',App.init,false);