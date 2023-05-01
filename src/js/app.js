//TODO: Migrate to MapbogGL JS, Zoom in out change viewer
mapboxgl.accessToken = 'pk.eyJ1Ijoia3VsaW9uZXIiLCJhIjoiY2tuNTB1YXhnMDg3dDJ1cDh0aHRmNmc5diJ9.0D_Jj39P9DYUQ0oP2kyFOg';
App = {

    socket : io('https://tle-to-latlng.onrender.com/'), //io('localhost:5000'),io('https://tletolatlng.herokuapp.com/')
    tleList : {},
    geo_cords : {},
    current_sat : null,
    tooltipTriggerList : [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')),
    state : {
        is_menu_open : false,
        is_starting : true,
        is_draw_starting : true,
        is_tracking : false,
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
    viewer : document.getElementById('map'),
    map : {

        map : new mapboxgl.Map({
            container: 'map',
            center : [30.313445, 3.212532],
            zoom : 3,
            minZoom: 0,
            projection: 'globe',
            style:"mapbox://styles/kulioner/ckyx4j4u8006d15ldk73bk5gl",
            }),

        style : {
            default : "mapbox://styles/kulioner/ckyx4j4u8006d15ldk73bk5gl",
            night : "mapbox://styles/kulioner/cl5s47upd000814seqixyp60y"
        }, 

        markerElement : document.querySelector('.marker'),
        marker : new mapboxgl.Marker(document.querySelector('.marker')).setLngLat([30.313445, 3.212532]),

        popup : new mapboxgl.Popup({ closeButton: false,offset: 25  }),

        user_field_of_view_line  : {}, //TODO: add user_field_of_view_line

        userLine : {
            'type': 'FeatureCollection',
                    'features': [
                        {
                        'type': 'Feature',
                        'properties': {
                            'color': 'blue' 
                            },
                        'geometry': {
                        'type': 'LineString',
                        'coordinates': []
                        }
                    }
                ]   
            },
        satOrbits : {

            previous : {
                'type': 'FeatureCollection',
                        'features': [
                            {
                            'type': 'Feature',
                            'properties': {
                                'color': 'orange' 
                                },
                            'geometry': {
                            'type': 'LineString',
                            'coordinates': []
                            }
                        }
                    ]   
                },
            current : {
                'type': 'FeatureCollection',
                        'features': [
                            {
                            'type': 'Feature',
                            'properties': {
                                'color': 'red' 
                                },
                            'geometry': {
                            'type': 'LineString',
                            'coordinates': []
                            }
                        }
                    ]   
                },
            next : {
                'type': 'FeatureCollection',
                        'features': [
                            {
                            'type': 'Feature',
                            'properties': {
                                'color': 'green' 
                                },
                            'geometry': {
                            'type': 'LineString',
                            'coordinates': []
                            }
                        }
                    ]   
                },
        }
       
    },

    
    /*
   
   
    user_field_of_view_line : L.circle([], 48280.3,{color : 'white',title:'Field of view'}),
   */
    init : ()=>{

        
        window.cords = {sat : {},user : {}};
        window.sat_is_changed = window.current_sat = false;
       
    
        App.resize();
        
        fetch('./src/json/tle_list.json')
        .then(res => res.json())
        .then(json =>{

            App.tleList = window.tles = json;
            
            for(let i in App.tleList){
                if(i !=  'UNKNOWN'){
                    App.input.selectSatellite.innerHTML += "<option value='"+i+"'> &nbsp;"+i.toUpperCase()+"</option>";
    
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

        

        App.map.map.on('load', App.onMapLoad);

        App.socket.on('send',App.renderMapData);
        App.socket.on('tleError',App.tleErrorHandler);
        App.socket.on('sendTrack',App.renderSatelliteTrack);
        App.socket.on('tleInfo',App.tleInfoHandler);

        window.addEventListener('resize',App.resize,false);
        App.input.selectSatellite.addEventListener('change',App.changeSatellite,false);
        App.input.customTLE.addEventListener('keydown',App.getCustomSatellite,false);
        document.getElementById('get_pos').addEventListener('click',App.getPosition,false);
        document.getElementById('info').addEventListener('click',App.getWiki,false);

        document.getElementById('loading').style.display = 'none';    
        document.querySelector('.progress-bar').style.display = 'none';
        document.querySelector('.menu').style.pointerEvents = "all";

    },


    toggleMenu : ()=>{

        switch(App.state.is_menu_open){
            case true:
            App.closeMenu();
            App.viewer.removeEventListener('click',App.closeMenu,false);
                break;
            case false:
            App.openMenu();
            App.viewer.addEventListener('click',App.closeMenu,false);
                break
        }

    },
    closeMenu : ()=>{
        App.container.menu.style.transform = 'translate(-100%)';
        App.state.is_menu_open = false;
    },
    openMenu : ()=>{
        App.container.menu.style.transform = 'translate(0%)';
        App.state.is_menu_open = true;
    },
    resize : ()=>{
        App.container.loading.style.width = window.innerWidth + 'px';
        App.container.loading.style.height = window.innerHeight + 'px';
        App.viewer.style.width = (window.innerWidth + 30) + "px";
        App.viewer.style.height = (window.innerHeight + 30) + "px";
        App.map.map.resize();
    },
    onMapLoad: async () =>{

        App.map.map.setFog({
            "range": [0.2, 0.3],
            "horizon-blend": 0.2,
            "star-intensity": 0.15
        });

        App.map.marker.setPopup(App.map.popup);
        App.map.marker.addTo(App.map.map);

        Object.keys(App.map.satOrbits).forEach(key=>{
            App.map.map.addSource('orbit_'+key, {
                'type': 'geojson',
                'data': App.map.satOrbits[key]
            });
            App.map.map.addLayer({
                'id': 'orbit_'+key,
                'type': 'line',
                'source': 'orbit_'+key,
                'layout': {
                    'visibility': 'none',
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': App.map.satOrbits[key].features[0].properties.color,
                    'line-width': 4
                }
            });
        });

        App.map.map.addSource('user_line', {
            'type': 'geojson',
            'data': App.map.userLine
        });
        App.map.map.addLayer({
            'id': 'user_line',
            'type': 'line',
            'source': 'user_line',
            'layout': {
                'visibility': 'none',
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': App.map.userLine.features[0].properties.color,
                'line-width': 4
            }
        });

        App.openMenu();

    },

    centralizeMap : ()=>{
        App.map.map.flyTo({ 'center':  window.sat_cords.lngLat, 'zoom': 9, 'essential' : true });
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
            App.removeUserLine();
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
    tleInfoHandler : (data)=>{
        console.log("INFO:",data);
    },
    renderMapData : (data)=>{

        
        window.cords.sat = {
            lat : data.cords.lat,
            lng : data.cords.lng,
            lngLat : [ data.cords.lng, data.cords.lat ]
        }

        if(App.state.is_starting){

            window.sat_is_changed = true;

            App.map.popup.setHTML("<h1 class='mapPopup'>"+window.current_sat.toUpperCase()+"</h1>");
            App.map.markerElement.style.backgroundImage = "url('./src/images/satellites/"+window.current_sat+".png')";
            App.map.marker.setLngLat( window.cords.sat.lngLat );
            
                    
            App.map.map.flyTo({ 'center':  window.cords.sat.lngLat , 'zoom': 6 ,'essential' : true });

            App.state.is_starting = false;
            App.container.quickBtns.style.display = 'block';
            App.container.cordsDisplay.wrapper.style.display = 'block';
            App.container.loading.style.display = 'none';

                    
        }else{

            App.map.marker.setLngLat(window.cords.sat.lngLat );

            if(App.state.is_tracking){
                App.map.map.flyTo({ 'center' : window.cords.sat.lngLat, 'essential' : true });
            }
        
        }

        App.container.cordsDisplay.body.innerHTML = "Lat: " + window.cords.sat.lat.toFixed(10) +" | Lng: " + window.cords.sat.lng.toFixed(10);


    },
    getPosition : ()=>{
        App.container.kmDisplay.innerHTML = "Calculating...";
        App.container.kmDisplay.style.display = 'block';
        try{
            if(navigator.geolocation){

            navigator.geolocation.getCurrentPosition(pos=>{
            
                window.cords.user = {
                    lng : pos.coords.longitude,
                    lat : pos.coords.latitude,
                    lngLat : [pos.coords.longitude, pos.coords.latitude]   
                };

                App.interval.showKM = setInterval(App.drawUserLine,1000);
                document.getElementById('get_pos').removeEventListener('click',App.getPosition);
                document.getElementById('get_pos').addEventListener('click',App.removeUserLine);

            },()=>{
                App.container.kmDisplay.innerHTML = "";
                App.container.kmDisplay.style.display = 'none';
                alert('For this future, turn on the GPS and enable GEOLOCATION!');
            })  
        }else{
            alert('Your device not support Geolocation features!:(')
        }
        }catch(err){
            App.container.kmDisplay.innerHTML = "";
            App.container.kmDisplay.style.display = 'none';
            if(err) throw err;
            
        }

    },
    drawUserLine : ()=>{

        if(App.state.is_draw_starting){
            App.map.map.setLayoutProperty('user_line', 'visibility', 'visible');
            App.state.is_draw_starting = false;
        }
        App.map.userLine.features[0].geometry.coordinates =  [ window.cords.user.lngLat,window.cords.sat.lngLat ];
        App.map.map.getSource('user_line').setData( App.map.userLine );

        let line = turf.lineString([ window.cords.user.lngLat, window.cords.sat.lngLat ]);
        let userStaDiff = turf.length(line,{ units:'kilometers'} ).toFixed(2) + ' km';
        App.container.kmDisplay.innerHTML = userStaDiff;

    },
    removeUserLine : ()=>{

        clearInterval(App.interval.showKM);

        App.container.kmDisplay.innerHTML = "";
        App.map.userLine.features[0].geometry.coordinates =  [];
        App.map.map.getSource('user_line').setData( App.map.userLine );
        App.map.map.setLayoutProperty('user_line', 'visibility', 'none');
        //App.user_field_of_view_line.remove();
        document.getElementById('get_pos').removeEventListener('click',App.removeUserLine);
        document.getElementById('get_pos').addEventListener('click',App.getPosition);
        App.container.kmDisplay.style.display ='none';
    
        App.state.is_draw_starting = true;

    },
    renderSatelliteTrack : (data)=>{

        data.forEach(e => e.pop() );

        window.sat_orbits = data;

        try{

            Object.keys(App.map.satOrbits).forEach((key,idx) =>{

                App.map.satOrbits[key].features[0].geometry.coordinates = data[idx];
                App.map.map.getSource('orbit_' + key).setData( App.map.satOrbits[key]);
                App.map.map.setLayoutProperty('orbit_' + key, 'visibility', 'visible');

            });
            
        }catch(err){
            console.error(err);
            App.clearScreen();
            App.oneError('Orbit Error','<h3>An error occurred while processing the orbit data.</h3>');
        }
        
        

    },
    clearScreen : ()=>{

        App.container.loading.style.display = 'none';
        App.container.kmDisplay.style.display ='none';
        App.container.quickBtns.style.display = 'none';
        App.container.cordsDisplay.wrapper.style.display = 'none';
        App.state.is_starting = true;
        Object.keys(App.map.satOrbits).forEach(key=>{
            App.map.map.setLayoutProperty('orbit_' + key, 'visibility', 'none');
        });

    },
    oneError : (title,message)=>{

        App.container.wikiModal.title.innerHTML = title
        App.container.wikiModal.body.innerHTML = message;
        App.container.wikiModal.modal.show();

    },
    tleErrorHandler : (err)=>{

        console.log('ServerSide:',err);
        App.clearScreen();
        App.oneError('TLE Error!',`<h3>An error occurred while processing the TLE.</h3>`);
        
    }
    


}

window.addEventListener('DOMContentLoaded',App.init,false);