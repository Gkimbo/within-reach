import React, { useEffect, useState, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Spinner } from "@chakra-ui/react";

import ResultList from "./ResultList";
import GetActivity from "../services/GetActivity";
import LocationSearchBar from "./LocationSearchBar";

const CustomMap = (props) => {
    const [chosenLocation, setChosenLocation] = useState(null);
    const [customActivities, setCustomActivities] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [openInfoWindow, setOpenInfoWindow] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [error, setError] = useState("");

    const mapRef = useRef(null);

    const loader = new Loader({
        apiKey: "AIzaSyClukZ0HyAZru-8zwolHjvS8SnTCaK3V7c",
        libraries: ["places"],
    });

    const getCurrentPosition = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setChosenLocation({ lat: latitude, lng: longitude });
                },
                (error) => {
                    setError("Error getting user's location: " + error.message);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    };

    const getLocation = (request) => {
        loader.load().then(() => {
            const service = new google.maps.places.PlacesService(map);
            const searchRequest = {
                query: request,
            };
            service.textSearch(searchRequest, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    setChosenLocation(results[0].geometry.location);
                } else {
                    setError(`No results found for "${props.mapSearchQuery}".`);
                    setSearchResults([]);
                }
            });
        });
    };

    const centerMapOnMarker = (marker) => {
        setSelectedMarker(marker === selectedMarker ? null : marker);
    };

    useEffect(() => {
        setError("");
        loader.load().then(() => {
            const map = new google.maps.Map(document.getElementById("map"), {
                center: chosenLocation,
                zoom: 16,
            });
            mapRef.current = map;
            const userMarker = new google.maps.Marker({
                position: chosenLocation,
                map: map,
                icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                },
                title: "Your Location",
            });

            const service = new google.maps.places.PlacesService(map);

            const addMarkersAndInfoWindows = (places) => {
                places.forEach((result) => {
                    let resultContent;
                    if (result.photos) {
                        resultContent =
                            `<p>${result.name}</p>` +
                            `<p>${result.formatted_address}</p>` +
                            `<img src="${result.photos && result.photos[0].getUrl()}" alt="${
                                result.name
                            }" style="max-width: 100px; max-height: 100px;">`;
                    } else {
                        resultContent =
                            `<p>${result.name}</p>` + `<p>${result.formatted_address}</p>`;
                    }

                    const marker = new google.maps.Marker({
                        position: new google.maps.LatLng(
                            result.geometry.location.lat(),
                            result.geometry.location.lng()
                        ),
                        map: map,
                    });

                    const infowindow = new google.maps.InfoWindow({
                        content: resultContent,
                        ariaLabel: result.name,
                    });

                    marker.addListener("click", () => {
                        if (openInfoWindow) {
                            openInfoWindow.close();
                        }

                        if (result.geometry.location === selectedMarker) {
                            setSelectedMarker(null);
                            setOpenInfoWindow(null);
                        } else {
                            setSelectedMarker(result.geometry.location);
                            infowindow.open(map, marker);
                            setOpenInfoWindow(infowindow);
                            setSelectedActivity(result.activity);
                        }
                    });
                });
            };

            customActivities.map((activity) => {
                const request = {
                    query: activity.name,
                    location: chosenLocation,
                    radius: "150",
                };

                service.textSearch(request, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        results.forEach((result) => {
                            result.activity = activity.name;
                        });
                        setSearchResults((prevResults) => [...results, ...prevResults]);
                        addMarkersAndInfoWindows(results);
                        map.setCenter(results[0].geometry.location);
                    } else {
                        setError(`No ${activity.query} found.`);
                    }
                });
            });

            setSelectedMarker(null);
        });
    }, [chosenLocation]);

    useEffect(() => {
        GetActivity.getCustomActivities().then((activityData) => {
            setCustomActivities(activityData);
        });
        getCurrentPosition();
    }, []);

    useEffect(() => {
        getLocation(props.mapSearchQuery);
    }, [props.mapSearchQuery]);

    return (
        <div className="grid-x home-page-div">
            <div className="cell small-12 activity-title-1">
                <h1 className="page-title-1">
                    What you like{" "}
                    {props.mapSearchQuery
                        ? `in ${_.upperFirst(props.mapSearchQuery)}`
                        : "Near you!"}
                </h1>
                <LocationSearchBar setMapSearchQuery={props.setMapSearchQuery} />
            </div>
            <div className="cell small-12 medium-6 container-of-containers">
                <div className="cell small-12"></div>
                {chosenLocation === null ? (
                    <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="blue.500"
                        size="xl"
                    />
                ) : (
                    <ResultList
                        searchResults={searchResults}
                        centerMapOnMarker={centerMapOnMarker}
                        markerLocation={selectedMarker}
                        setSelectedMarker={setSelectedMarker}
                        setSelectedActivity={setSelectedActivity}
                        selectedActivity={selectedActivity}
                    />
                )}
                {error ? (
                    <div className="location-error">
                        <h3>{error} </h3>
                        <p>Please search the location you'd like to see in the search bar above</p>
                    </div>
                ) : null}
            </div>
            <div className="cell small-12 medium-6 ">
                <div id="map" className="container-4-map"></div>
            </div>
        </div>
    );
};

export default CustomMap;
