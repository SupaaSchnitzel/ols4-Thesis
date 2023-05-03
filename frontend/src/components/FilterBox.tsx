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
    const [isButton, setIsButton] = useState(true);
    const [show, setShow] = useState(false);
    let possible = useSelector((state:RootState) => state.filter.data.possible);
    possible = possible[0]
    const [crit, setCrit] = useState([]);
    const [possibleLoaded, setPossibleLoaded] = useState(false); 
     
    const state = useSelector((state)=>state);
    const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

    function handleForm(event){
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const jsonObject = Object.fromEntries(form);
        dispatch(fetchFilter(form));
        console.log(JSON.stringify(jsonObject));
        localStorage.setItem('filter', JSON.stringify(jsonObject));
    }

    function handleButton(event){
        event.preventDefault();
        console.log(state);
    }
    
    

    const showing = () =>{
        setShow(!show)
    }
    function options(key, possible) {
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
        dispatch(fetchPossible());
        dispatch(fetchAll());
    }, []);

    const critparams = () =>{
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



