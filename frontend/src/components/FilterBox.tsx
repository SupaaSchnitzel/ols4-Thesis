import { Checkbox, FormControlLabel } from "@mui/material";
import { Fragment, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { get, getPaginated } from "../app/api";
import { randomString } from "../app/util";
import Entity from "../model/Entity";
import { thingFromProperties } from "../model/fromProperties";
import Ontology from "../model/Ontology";
import { Suggest } from "../model/Suggest";
import Thing from "../model/Thing";
import {fetchAll, fetchFilter, fetchPossible} from "./FilterSlice";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import {RootState} from "../app/store"
import {ThunkDispatch} from "@reduxjs/toolkit";

export default function FilterBox(){
    /**
   * Returns the Filterbox Fragment used for filtering the ontologies.
   *
   * 
   *
   * @returns The Fragment to be used in sites.
   *
   * 
   */
    //State that keeps track of the button used for showing the criteria
    const [isButton, setIsButton] = useState(true);
    //State that keeps track of if the criteria form should be shown
    const [show, setShow] = useState(false);
    //The possible values the criteria can take.
    let possible = useSelector((state:RootState) => state.filter.data.possible);
    possible = possible[0]
    
    //The state
    const state = useSelector((state)=>state);
    //used for dispatching slice functions
    const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

    function handleForm(event){
        /**
        * Keeps track of changes in the form data and dispatches API requests through fetchFilter based on the current values.
        *
        *
        * @param event - The event that triggers the function
        *
        * 
        */
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const jsonObject = Object.fromEntries(form);
        dispatch(fetchFilter(form));
        localStorage.setItem('filter', JSON.stringify(jsonObject));
    }
     
    const showing = () =>{
         /**
        * Helper function for showing/not showing the criteria form.
        *
        *
        * 
        */
        setShow(!show)
    }

    function options(key, possible) {
         /**
        * Builds the select for the given criteria key
        *
        *
        * @param key - The criteria for the select
        * @param possible - All possible values the criteria key can take.
        * @returns Select html for a criteria key.
        *
        * 
        */
        return (
            <select defaultValue='none' id={key} name={key} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                <option value="none" disabled hidden>Select an Option</option>
                {
                    possible[key].map((index) =>{
                        return (<option id={index} value={index}>{index}</option>);
                    })
                };   
        </select>
    );
    }
    useEffect(() => {
         /**
        * The useEffect for this Fragment, triggers the API fetch for all possible criteria values and the ontologies.
        *
        *
        * 
        */
        dispatch(fetchPossible());
        dispatch(fetchAll());
    }, []);

    const critparams = () =>{
         /**
        * Builds the Form for some criteria.
        *
        *
        * @returns Html form with selects for the license and ont_languages criteria
        *
        * 
        */
        return(
            <form id='CritForm' onChange={handleForm}>
                <div className="w-full flex flex-wrap flex-row place-items-center">
                    {possible && Object.keys(possible).map((key)=>{
                        if (key == 'license' || key == 'ont_languages'){
                            return(
                                <div className="col-span-2">
                                    <label id ={key}>{key}</label>
                                    {options(key,possible)}
                                </div>
                        )
                        }else{
                            return null;
                        }
                
                    })}
                </div>
            </form>
        )
    }
    function displayButtons(){
         /**
        *  Helper function that decides if the Button should be shown
        *
        *
        * @returns Select html for the Criteria Button.
        *
        * 
        */
        
        return(
            <div>
                <button id='CritButton' className="button-secondary text-lg font-bold self-center" type='button' onClick={showing}> Ontology Criteria</button>
            </div>
                
        )
        
    }

    return(
        <Fragment>
            {isButton? displayButtons(): null}
            
            {show? critparams() :null}
        </Fragment>
    
    );
}



