import { KeyboardArrowDown } from "@mui/icons-material";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { randomString, usePrevious } from "../../app/util";
import Header from "../../components/Header";
import LoadingOverlay from "../../components/LoadingOverlay";
import { Pagination } from "../../components/Pagination";
import SearchBox from "../../components/SearchBox";
import Entity from "../../model/Entity";
import { getSearchResults } from "./searchSlice";

import {RootState} from "../../app/store"
import { useSelector } from "react-redux";
import {fetchAll, fetchFilter, fetchPossible} from "../../components/FilterSlice";

export default function Search() {
  const params = useParams();
  let search: string = params.search as string;
  //MINE
  let possible = useSelector((state:RootState) => state.filter.data.possible);
  possible = possible[0]
  let all = useSelector((state:RootState) => state.filter.data.all);
  let filter = useSelector((state:RootState) => state.filter.data.filter);
  let isFilter = useSelector((state:RootState) => state.filter.isFilter);
   
  function score(name:String){
    let score = 0;
    for(var i in all.onts){
      for(var key in Object.keys(all.onts[i])){        
        if (  all.onts[i][Object.keys(all.onts[i])[key]] == name){
          score = score + all.onts[i]['bp_score'];
          score = score + all.onts[i]['pi_score'];
          score = score + all.onts[i]['gov_score'];
          score = score + all.onts[i]['ac_score'];
          return(
            
              <span className="text-l font-bold inline-block py-1 px-2 uppercase rounded uppercase last:mr-0 mr-1">
                Total Score: {score}
              </span>
            
          )
        }
      }
    }
    return(<span className="text-l font-bold inline-block py-1 px-2 uppercase rounded uppercase last:mr-0 mr-1">
    Total Score: Not available
  </span>)
  }
  //END
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loadingResults = useAppSelector(
    (state) => state.search.loadingSearchResults
  );
  const results = useAppSelector((state) => state.search.searchResults);
  let results2 = orderResults()
  const totalResults = useAppSelector(
    (state) => state.search.totalSearchResults
  );
  const facets = useAppSelector((state) => state.search.facets);
  const prevSearch = usePrevious(search);

  //   const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>(search);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchParams, setSearchParams] = useSearchParams();

  const ontologyFacets =
    facets && Object.keys(facets).length > 0 ? facets["ontologyId"] : {};
  const [ontologyFacetSelected, setOntologyFacetSelected] = useState<string[]>(
    []
  );

  
  const handleOntologyFacet = useCallback(
    (checked, key) => {
      let selected: string[] = ontologyFacetSelected;
      if (checked) {
        selected = [...selected, key];
      } else {
        selected = selected.filter((facet) => facet !== key);
      }
      setOntologyFacetSelected((prev) => {
        if (selected !== prev) setPage(0);
        return selected;
      });
    },
    [ontologyFacetSelected, setOntologyFacetSelected]
  );
  const typeFacets =
    facets && Object.keys(facets).length > 0 ? facets["type"] : {};
  const [typeFacetSelected, setTypeFacetSelected] = useState<string[]>([]);
  const handleTypeFacet = useCallback(
    (checked, key) => {
      let selected: string[] = typeFacetSelected;
      if (checked) {
        selected = [...selected, key];
      } else {
        selected = selected.filter((facet) => facet !== key);
      }
      setTypeFacetSelected((prev) => {
        if (selected !== prev) setPage(0);
        return selected;
      });
    },
    [typeFacetSelected, setTypeFacetSelected]
  );



  useEffect(() => {
    dispatch(
      getSearchResults({
        page,
        rowsPerPage,
        search,
        ontologyId: ontologyFacetSelected,
        type: typeFacetSelected,
        searchParams,
      })
    );
  }, [
    dispatch,
    search,
    page,
    rowsPerPage,
    ontologyFacetSelected,
    typeFacetSelected,
    searchParams,
  ]);
  useEffect(() => {
    if (prevSearch !== search) setPage(0);
  }, [search, prevSearch]);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  useEffect(() =>{

    dispatch(fetchPossible());
    dispatch(fetchAll());
  },[])

  useEffect(()=>{
    results2 = orderResults();
  },[results, filter])
  

    {/* TODO::: CRITERIA FACETS */}
  

  


    function Test() {
      console.log('start TEST');
      console.log(filter)
      console.log(orderResults())
      console.log('end TEST');
    };
    function handleForm(event){
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      dispatch(fetchFilter(form));
  }
  function options(key, possible) {
    if(isFilter){
      let formparams = localStorage.getItem('filter');
      let jsonobj = formparams ? JSON.parse(formparams): {};
      return (
        <select defaultValue={jsonobj[key]?jsonobj[key]:'none'} id={key} name={key} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            <option value="none" disabled hidden>Select an Option</option>
            {
                possible && possible[key].map((index) =>{
                    return (<option id={index} value={index}>{index}</option>);
                })
            };   
        </select>
      );
    }else{
      return (
          <select defaultValue='none' id={key} name={key} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
              <option value="none" disabled hidden>Select an Option</option>
              {
                  possible && possible[key].map((index) =>{
                      return (<option id={index} value={index}>{index}</option>);
                  })
              };   
          </select>
        );
      }
    }

    function getScore(name:string){
      let score = 0;
      for(var i in all.onts){
        for(var key in Object.keys(all.onts[i])){        
          if (  all.onts[i][Object.keys(all.onts[i])[key]] == name){
            score = score + all.onts[i]['bp_score'];
            score = score + all.onts[i]['pi_score'];
            score = score + all.onts[i]['gov_score'];
            score = score + all.onts[i]['ac_score'];
            return score;
          }
        }
      return score;
      }
      return 0;
    }

    function inFilter(entity, index, array){
      return filter.onts.includes(entity.getOntologyId());
    }

    function notInFilter(entity, index, array){
      return !filter.onts.includes(entity.getOntologyId());
    }

    function orderResults(){
      let results2 = [...results];
      results2.sort(
        (a: Entity,b: Entity) => (getScore(a.getOntologyId()) > getScore(b.getOntologyId()) ? -1 : 1)
      );
      if(isFilter){
        let inF, notInF;
        inF = results2.filter(inFilter);
        notInF = results2.filter(notInFilter);
        results2 = inF.concat(notInF);
        //Sresults2 = notInF.concat(inF);
      }
      
      return results2;
    }

    function displaycriteria(){
      
        return(
          <form id='CritForm' onChange={handleForm}>
          <div className="w-full flex flex-wrap flex-row place-items-center">
              {possible && Object.keys(possible).map((key)=>{
                  if (key === 'license' || key === 'ont_languages'){
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
      </form>)
      

    }
    {/* TODO end::: CRITERIA FACETS */}

  return (
    <div>
      <Header section="home" />
      <main className="container mx-auto h-fit my-8">
        <div className="flex flex-nowrap gap-4 mb-6">
          <SearchBox initialQuery={query} />
        </div>
        <div className="grid grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="bg-gradient-to-r from-neutral-light to-white rounded-lg p-8">
              <div className="font-bold text-neutral-dark text-sm mb-4">
                {`Showing ${
                  totalResults > rowsPerPage ? rowsPerPage : totalResults
                } from a total of ${totalResults}`}
              </div>
              {totalResults > 0 ? (
                <div className="text-neutral-black">
                  <div className="font-semibold text-lg mb-2">Type</div>
                  <fieldset className="mb-4">
                    {typeFacets && Object.keys(typeFacets).length > 0
                      ? Object.keys(typeFacets).map((key) => {
                          if (key !== "entity" && typeFacets[key] > 0) {
                            return (
                              <label
                                key={key}
                                htmlFor={key}
                                className="block p-1 w-fit"
                              >
                                <input
                                  type="checkbox"
                                  id={key}
                                  className="invisible hidden peer"
                                  onChange={(e) => {
                                    handleTypeFacet(e.target.checked, key);
                                  }}
                                />
                                <span className="input-checkbox mr-4" />
                                <span className="capitalize mr-4">
                                  {key} &#40;{typeFacets[key]}&#41;
                                </span>
                              </label>
                            );
                          } else return null;
                        })
                      : null}
                  </fieldset>
                  <div className="font-semibold text-lg mb-2">Ontology</div>
                  <fieldset>
                    {ontologyFacets && Object.keys(ontologyFacets).length > 0
                      ? Object.keys(ontologyFacets).map((key) => {
                          if (ontologyFacets[key] > 0) {
                            return (
                              <label
                                key={key}
                                htmlFor={key}
                                className="block p-1 w-fit"
                              >
                                <input
                                  type="checkbox"
                                  id={key}
                                  className="invisible hidden peer"
                                  onChange={(e) => {
                                    handleOntologyFacet(e.target.checked, key);
                                  }}
                                />
                                <span className="input-checkbox mr-4" />
                                <span className="uppercase mr-4">
                                  {key} &#40;{ontologyFacets[key]}&#41;
                                </span>
                              </label>
                            );
                            
                          } else return null;
                        })
                      : null}
                  </fieldset>
                  {/* TODO HERE ALL CRITERIA*, rewrite so that it maps criteria from object to right searchtype, write handleCriteriaFacet for onchange */ }
                  <div className="font-semibold text-lg mb-2">Criteria</div>
                  <fieldset>
                    {displaycriteria()}
                  </fieldset>
                  {/* TODO End*/ }
                </div>
              ) : null}
            </div>
          </div>
          <div className="col-span-3">
            <div className="grid grid-cols-4 mb-4">
              <div className="justify-self-start col-span-3 self-center text-2xl font-bold text-neutral-dark">
                Search results for: {search}
              </div>
              <div className="justify-self-end col-span-1">
                <div className="flex group relative text-md">
                  <label className="self-center px-3">Show</label>
                  <select
                    className="input-default appearance-none pr-7 z-20 bg-transparent"
                    onChange={(e) => {
                      const rows = parseInt(e.target.value);
                      setRowsPerPage((prev) => {
                        if (rows !== prev) setPage(0);
                        return rows;
                      });
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={100}>100</option>
                  </select>
                  <div className="absolute right-2 top-2 z-10 text-neutral-default group-focus:text-neutral-dark group-hover:text-neutral-dark">
                    <KeyboardArrowDown fontSize="medium" />
                  </div>
                </div>
              </div>
            </div>
            {results.length > 0 ? (
              <div>
                <Pagination
                  page={page}
                  onPageChange={setPage}
                  dataCount={totalResults}
                  rowsPerPage={rowsPerPage}
                />
                {results2.map((entity: Entity) => {
                  return (
                    <div key={randomString()} className="my-4">
                      <div className="mb-1 leading-loose truncate">
                        <Link
                          to={
                            "/ontologies/" +
                            entity.getOntologyId() +
                            "/" +
                            entity.getTypePlural() +
                            "/" +
                            encodeURIComponent(
                              encodeURIComponent(entity.getIri())
                            )
                          }
                          className="link-default text-xl mr-2"
                        >
                          {entity.getName()}
                        </Link>
                        <span className="bg-orange-default text-white rounded-md px-2 py-1 w-fit font-bold break-all">
                          {entity.getShortForm()}
                        </span>
                      </div>
                      <div className="mb-1 leading-relaxed text-sm text-neutral-default">
                        {entity.getIri()}
                      </div>
                      <div className="mb-1 leading-relaxed">
                        {entity.getDescription()}
                      </div>
                      <div className="leading-loose">
                        <span className="font-bold">Ontology:</span>
                        &nbsp;
                        <Link to={"/ontologies/" + entity.getOntologyId()}>
                          <span
                            className="link-ontology px-2 py-1 rounded-md text-sm text-white uppercase w-fit font-bold break-all"
                            title={entity.getOntologyId().toUpperCase()}
                          >
                            {entity.getOntologyId()}
                          </span>
                        </Link>
                        {score(entity.getOntologyId())}
                      </div>
                    </div>
                  );
                })}
                <Pagination
                  page={page}
                  onPageChange={setPage}
                  dataCount={totalResults}
                  rowsPerPage={rowsPerPage}
                />
              </div>
            ) : (
              <div className="text-xl text-neutral-black font-bold">
                No results!
              </div>
            )}
          </div>
        </div>
        {loadingResults ? (
          <LoadingOverlay message="Search results loading..." />
        ) : null}
      </main>
    </div>
  );
}
