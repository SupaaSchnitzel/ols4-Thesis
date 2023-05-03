import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export const fetchFilter = createAsyncThunk('filter/fetchFilter', async (formdata:FormData) => {
    let url ='http://localhost:5000/names?';
    var object = {};
    formdata.forEach((value, key) => 
        object[key] = value
    );
    for (const key of Object.keys(object)) {
        url = url +String(key) + '=' + object[key];
        url = url + '&';
      }
    url = url.slice(0,-1);
    let response = await fetch(url);
    return response.json();
})

export const fetchPossible = createAsyncThunk('filter/fetchPossible', async () => {
    let url ='http://localhost:5000/possible';
    let response = await fetch(url);
    return response.json();
})
export const fetchAll = createAsyncThunk('filter/fetchAll', async () => {
    let url ='http://localhost:5000/ont';
    let response = await fetch(url);
    return response.json();
})



const filterSlice = createSlice({
    name:"filter",
    initialState: {
        isLoading: false,
        data: {possible:{}, filter:{onts:[{name:''}]}, filterparams:[], all:{onts:[{name:'', ac_score:1, bp_score:1, gov_score:1, pi_score:1},{name:'', ac_score:1, bp_score:1, gov_score:1, pi_score:1}]}},
        isFilter: false,
        isError: false,
    },
    reducers: {},
    extraReducers: (builder) =>{
        builder.addCase(fetchFilter.pending, (state, action) =>{
            console.log('LOADING')
            state.isLoading = true;
        });
        builder.addCase(fetchFilter.fulfilled, (state, action) =>{
            state.isLoading = false;
            state.data.filter = action.payload;
            state.isFilter = true;
        });
        builder.addCase(fetchFilter.rejected, (state, action) =>{
            console.log('WTF')
            console.log(action)
            console.log('Error', action.payload);
            state.isError = true;
        });
        builder.addCase(fetchPossible.pending, (state, action) =>{
            console.log('LOADING')
            state.isLoading = true;
        });
        builder.addCase(fetchPossible.fulfilled, (state, action) =>{
            state.isLoading = false;
            state.data.possible = action.payload;
        });
        builder.addCase(fetchPossible.rejected, (state, action) =>{
            console.log('WTF')
            console.log(action)
            console.log('Error', action.payload);
            state.isError = true;
        });
        builder.addCase(fetchAll.pending, (state, action) =>{
            console.log('LOADING')
            state.isLoading = true;
        });
        builder.addCase(fetchAll.fulfilled, (state, action) =>{
            state.isLoading = false;
            state.data.all = action.payload;
        });
        builder.addCase(fetchAll.rejected, (state, action) =>{
            console.log('WTF')
            console.log(action)
            console.log('Error', action.payload);
            state.isError = true;
        });
    }
});
  
export default filterSlice.reducer;