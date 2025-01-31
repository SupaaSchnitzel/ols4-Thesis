import {
  createAction,
  createAsyncThunk,
  createSlice,
  PayloadAction
} from "@reduxjs/toolkit";
import { get, getPaginated, Page } from "../../app/api";
import Entity from "../../model/Entity";
import { thingFromProperties } from "../../model/fromProperties";
import Ontology from "../../model/Ontology";
import createTreeFromEntities from "./entities/createTreeFromEntities";

export interface OntologiesState {
  ontology: Ontology | undefined;
  entity: Entity | undefined;
  nodesWithChildrenLoaded: string[]
  nodeChildren: any;
  rootNodes: TreeNode[];
  ontologies: Ontology[];
  totalOntologies: number;
  entities: Entity[];
  totalEntities: number;
  loadingOntologies: boolean;
  loadingEntities: boolean;
  numPendingTreeRequests: number;
  loadingOntology: boolean;
  loadingEntity: boolean;
  classInstances: Page<Entity> | null;
  loadingClassInstances: boolean;
  automaticallyExpandedNodes: string[];
  manuallyExpandedNodes: string[];
  preferredRoots: boolean;
  showObsolete: boolean;
  showSiblings: boolean;
  showCounts: boolean;
}
export interface TreeNode {
  absoluteIdentity: string; // the IRIs of this node and its ancestors delimited by a ;
  iri: string;
  title: string;
  expandable: boolean;
  entity: Entity;
  numDescendants: number;
}
const initialState: OntologiesState = {
  ontology: undefined,
  entity: undefined,
  nodesWithChildrenLoaded: [],
  nodeChildren: {},
  rootNodes: [],
  ontologies: [],
  totalOntologies: 0,
  entities: [],
  totalEntities: 0,
  loadingOntologies: false,
  loadingEntities: false,
  numPendingTreeRequests: 0,
  loadingOntology: false,
  loadingEntity: false,
  classInstances: null,
  loadingClassInstances: false,
  automaticallyExpandedNodes: [],
  manuallyExpandedNodes: [],
  preferredRoots: false,
  showObsolete: false,
  showSiblings: false,
  showCounts: true
};

export const resetTreeContent = createAction("ontologies_tree_reset_content");
export const resetTreeSettings = createAction<{entityType:string, selectedEntity?:Entity}>("ontologies_tree_reset_settings");

export const enablePreferredRoots = createAction(
  "ontologies_preferred_enabled"
);
export const disablePreferredRoots = createAction(
  "ontologies_preferred_disabled"
);
export const openNode = createAction<TreeNode>("ontologies_node_open");
export const closeNode = createAction<TreeNode>("ontologies_node_close");

export const showObsolete = createAction("ontologies_show_obsolete");
export const hideObsolete = createAction("ontologies_hide_obsolete");

export const showSiblings = createAction("ontologies_show_siblings");
export const hideSiblings = createAction("ontologies_hide_siblings");

export const showCounts = createAction("ontologies_show_counts");
export const hideCounts = createAction("ontologies_hide_counts");


export const getOntology = createAsyncThunk(
  "ontologies_ontology",
  async ({ ontologyId, lang }: { ontologyId: string; lang: string }) => {
    const ontologyProperties = await get<any>(
      `api/v2/ontologies/${ontologyId}`,
      { lang }
    );
    return new Ontology(ontologyProperties);
  }
);
export const getEntity = createAsyncThunk(
  "ontologies_entity",
  async ({ ontologyId, entityType, entityIri, lang }: any) => {
    const doubleEncodedTermUri = encodeURIComponent(
      encodeURIComponent(entityIri)
    );
    const termProperties = await get<any>(
      `api/v2/ontologies/${ontologyId}/${entityType}/${doubleEncodedTermUri}`,
      { lang }
    );
    return thingFromProperties(termProperties);
  }
);
export const getClassInstances = createAsyncThunk(
  "ontologies_entity_class_instances",
  async ({ ontologyId, classIri, lang }: any) => {
    const doubleEncodedTermUri = encodeURIComponent(
      encodeURIComponent(classIri)
    );
    const instances = (
      await getPaginated<any>(
        `api/v2/ontologies/${ontologyId}/classes/${doubleEncodedTermUri}/instances`,
        { lang }
      )
    ).map((i) => thingFromProperties(i));
    return instances;
  }
);
export const getOntologies = createAsyncThunk(
  "ontologies_ontologies",
  async ({ page, rowsPerPage, search }: any, { rejectWithValue }) => {
    try {
      const data = (
        await getPaginated<any>(
          `api/v2/ontologies?page=${page}&size=${rowsPerPage}${
            search ? "&search=" + search : ""
          }`
        )
      ).map((o) => new Ontology(o));
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
export const getEntities = createAsyncThunk(
  "ontologies_entities",
  async (
    { ontologyId, entityType, page, rowsPerPage, search }: any,
    { rejectWithValue }
  ) => {
    try {
      const data = (
        await getPaginated<any>(
          `api/v2/ontologies/${ontologyId}/${entityType}?page=${page}&size=${rowsPerPage}${
            search ? "&search=" + search : ""
          }`
        )
      ).map((e) => thingFromProperties(e));
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
export const getAncestors = createAsyncThunk(
  "ontologies_ancestors",
  async ({ ontologyId, entityType, entityIri, lang, showObsoleteEnabled }: any) => {
    const doubleEncodedUri = encodeURIComponent(encodeURIComponent(entityIri));
    if (entityType === "classes") {
      var ancestorsPage = await getPaginated<any>(
        `api/v2/ontologies/${ontologyId}/classes/${doubleEncodedUri}/hierarchicalAncestors?${new URLSearchParams(
          { size: "100", lang, includeObsoleteEntities: showObsoleteEnabled }
        )}`
      );
    } else {
      var ancestorsPage = await getPaginated<any>(
        `api/v2/ontologies/${ontologyId}/${entityType}/${doubleEncodedUri}/ancestors?${new URLSearchParams(
          { size: "100", lang, includeObsoleteEntities: showObsoleteEnabled }
        )}`
      );
    }
    return ancestorsPage.elements.map((obj) => thingFromProperties(obj));
  }
);
export const getRootEntities = createAsyncThunk(
  "ontologies_roots",
  async ({ ontologyId, entityType, preferredRoots, lang, showObsoleteEnabled }: any) => {
    if (entityType === "individuals") {
      const [classesWithIndividuals,orphanedIndividuals] = await Promise.all([
		getPaginated<any>(
		`api/v2/ontologies/${ontologyId}/classes?${new URLSearchParams({
		hasIndividuals: "true",
		size: "100",
		lang,
		includeObsoleteEntities: showObsoleteEnabled
		})}`),
		getPaginated<any>(
		`api/v2/ontologies/${ontologyId}/individuals?${new URLSearchParams({
		hasDirectParent: "false",
		size: "100",
		lang,
		includeObsoleteEntities: showObsoleteEnabled
		})}`)
	])
      return {
	entityType,
	rootTerms: null,
	classesWithIndividuals: classesWithIndividuals.elements.map((obj) => thingFromProperties(obj)),
	orphanedIndividuals: orphanedIndividuals.elements.map((obj) => thingFromProperties(obj))
      }
    } else if (entityType === "classes" && preferredRoots) {
      const rootsPage = await getPaginated<any>(
        `api/v2/ontologies/${ontologyId}/${entityType}?${new URLSearchParams({
          isPreferredRoot: "true",
          size: "100",
          lang,
	  includeObsoleteEntities: showObsoleteEnabled
        })}`)
	return {
		entityType,
		rootTerms: rootsPage.elements.map((obj) => thingFromProperties(obj)),
		classesWithIndividuals: null,
		orphanedIndividuals: null
	}
    } else {
      const rootsPage = await getPaginated<any>(
        `api/v2/ontologies/${ontologyId}/${entityType}?${new URLSearchParams({
          hasDirectParent: "false",
          size: "100",
          lang,
	  includeObsoleteEntities: showObsoleteEnabled
        })}`
      );
	return {
		entityType,
		rootTerms: rootsPage.elements.map((obj) => thingFromProperties(obj)),
		classesWithIndividuals: null,
		orphanedIndividuals: null
	}
    }
  }
);
export const getNodeChildren = createAsyncThunk(
  "ontologies_node_children",
  async ({
    ontologyId,
    entityTypePlural,
    entityIri,
    absoluteIdentity,
    lang,
    includeObsoleteEntities: showObsoleteEnabled
  }: any) => {
    const doubleEncodedUri = encodeURIComponent(encodeURIComponent(entityIri));
    if (entityTypePlural === "classes") {
      var childrenPage = await getPaginated<any>(
        `api/v2/ontologies/${ontologyId}/classes/${doubleEncodedUri}/hierarchicalChildren?${new URLSearchParams(
          {
            size: "100",
            lang,
         	includeObsoleteEntities: showObsoleteEnabled
          }
        )}`
      );
    } else if (entityTypePlural === "individuals") {
      var childrenPage = await getPaginated<any>(
        `api/v2/ontologies/${ontologyId}/classes/${doubleEncodedUri}/instances?${new URLSearchParams(
          {
            size: "100",
            lang,
         	includeObsoleteEntities: showObsoleteEnabled
          }
        )}`
      );
    } else {
      var childrenPage = await getPaginated<any>(
        `api/v2/ontologies/${ontologyId}/${entityTypePlural}/${doubleEncodedUri}/children?${new URLSearchParams(
          {
            size: "100",
            lang,
         	includeObsoleteEntities: showObsoleteEnabled
          }
        )}`
      );
    }
    return {
      absoluteIdentity,
      children: childrenPage.elements
        .map((obj) => thingFromProperties(obj))
        .map((term) => {
          return {
            iri: term.getIri(),
            absoluteIdentity: absoluteIdentity + ";" + term.getIri(),
            title: term.getName(),
            expandable: term.hasDirectChildren(),
            entity: term,
            numDescendants:
              term.getNumHierarchicalDescendants() || term.getNumDescendants(),
          };
        }),
    };
  }
);

const ontologiesSlice = createSlice({
  name: "ontologies",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      getOntology.fulfilled,
      (state: OntologiesState, action: PayloadAction<Ontology>) => {
        state.ontology = action.payload;
        state.loadingOntology = false;
      }
    );
    builder.addCase(getOntology.pending, (state: OntologiesState) => {
      state.ontology = undefined;
      state.loadingOntology = true;
    });
    builder.addCase(
      getEntity.fulfilled,
      (state: OntologiesState, action: PayloadAction<Entity>) => {
        state.entity = action.payload;
        state.loadingEntity = false;
      }
    );
    builder.addCase(getEntity.pending, (state: OntologiesState) => {
      state.loadingEntity = true;
    });
    builder.addCase(
      getClassInstances.fulfilled,
      (state: OntologiesState, action: PayloadAction<Page<Entity>>) => {
        state.classInstances = action.payload;
        state.loadingClassInstances = false;
      }
    );
    builder.addCase(getClassInstances.pending, (state: OntologiesState) => {
      state.loadingClassInstances = true;
    });
    builder.addCase(
      getAncestors.pending,
      (state: OntologiesState) => {
        ++ state.numPendingTreeRequests;
      }
    );
    builder.addCase(
      getAncestors.fulfilled,
      (state: OntologiesState, action: PayloadAction<Entity[]>) => {
        let { rootNodes, nodeChildren, automaticallyExpandedNodes } = createTreeFromEntities(
          [state.entity!, ...action.payload],
          state.preferredRoots,
          state.ontology!
        );
        state.rootNodes = rootNodes;
        state.nodeChildren = nodeChildren;
	state.automaticallyExpandedNodes = Array.from(new Set([...state.automaticallyExpandedNodes, ...Array.from(automaticallyExpandedNodes) ]))
	-- state.numPendingTreeRequests;
      }
    );
    builder.addCase(
      getAncestors.rejected,
      (state: OntologiesState) => {
        -- state.numPendingTreeRequests;
      }
    );
    builder.addCase(getNodeChildren.pending, (state: OntologiesState) => {
        ++ state.numPendingTreeRequests;
    });
    builder.addCase(
      getNodeChildren.fulfilled,
      (
        state: OntologiesState,
        action: PayloadAction<{
          absoluteIdentity: string;
          children: TreeNode[];
        }>
      ) => {
        state.nodeChildren = {
          ...state.nodeChildren,
          [action.payload.absoluteIdentity]: action.payload.children,
        };
	state.nodesWithChildrenLoaded.push(action.payload.absoluteIdentity)
        -- state.numPendingTreeRequests;
      }
    );
    builder.addCase(getNodeChildren.rejected, (state: OntologiesState) => {
        -- state.numPendingTreeRequests;
    });
    builder.addCase(
      getRootEntities.pending,
      (state: OntologiesState) => {
         ++ state.numPendingTreeRequests;
      })
    builder.addCase(
      getRootEntities.fulfilled,
      (state: OntologiesState, action: PayloadAction<any>) => {

	let { entityType, rootTerms, classesWithIndividuals, orphanedIndividuals } = action.payload;

	console.log('rootTerms')
	console.dir(rootTerms)

        let { allNodes, rootNodes, nodeChildren, automaticallyExpandedNodes } = createTreeFromEntities(
          [ ...(rootTerms || []), ...(classesWithIndividuals || []), ...(orphanedIndividuals || []) ],
          state.preferredRoots,
          state.ontology!
        );

        state.rootNodes = rootNodes;
        state.nodeChildren = nodeChildren;
	state.automaticallyExpandedNodes = Array.from(new Set([...state.automaticallyExpandedNodes, ...Array.from(automaticallyExpandedNodes) ]))
        -- state.numPendingTreeRequests;
      }
    );
    builder.addCase(
      getRootEntities.rejected,
      (state: OntologiesState) => {
         -- state.numPendingTreeRequests;
      })
    builder.addCase(
      getOntologies.fulfilled,
      (state: OntologiesState, action: PayloadAction<Page<Ontology>>) => {
        state.ontologies = action.payload.elements;
        state.totalOntologies = action.payload.totalElements;
        state.loadingOntologies = false;
      }
    );
    builder.addCase(getOntologies.pending, (state: OntologiesState) => {
      state.loadingOntologies = true;
    });
    builder.addCase(getOntologies.rejected, (state: OntologiesState) => {
      state.ontologies = initialState.ontologies;
      state.loadingOntologies = false;
    });
    builder.addCase(
      getEntities.fulfilled,
      (state: OntologiesState, action: PayloadAction<Page<Entity>>) => {
        state.entities = action.payload.elements;
        state.totalEntities = action.payload.totalElements;
        state.loadingEntities = false;
      }
    );
    builder.addCase(getEntities.pending, (state: OntologiesState) => {
      state.loadingEntities = true;
    });
    builder.addCase(getEntities.rejected, (state: OntologiesState) => {
      state.entities = initialState.entities;
      state.loadingEntities = false;
    });
    builder.addCase(resetTreeContent, (state: OntologiesState) => {
//       console.log('Resetting tree content')
      state.nodesWithChildrenLoaded = []
      state.nodeChildren = {};
      state.rootNodes = [];
      state.automaticallyExpandedNodes = [];
    });
    builder.addCase(resetTreeSettings, (state: OntologiesState, action: PayloadAction<{entityType:string, selectedEntity?:Entity}>) => {
      console.log('Resetting tree settings')

      state.preferredRoots = action.payload.entityType === 'classes' && state.ontology!.getPreferredRoots().length > 0;

      if(action.payload.selectedEntity) {
	let selectedIsDescendantOfPreferredRoots = false
	for(let root of state.ontology!.getPreferredRoots()) {
		if(action.payload.selectedEntity.getHierarchicalAncestorIris().indexOf(root) !== -1) {
			selectedIsDescendantOfPreferredRoots = true;
			break;
		}
	}
	if(!selectedIsDescendantOfPreferredRoots) {
		state.preferredRoots = false
	}
      }

      state.showObsolete = false;
      state.showSiblings = false;
      state.showCounts = true;
      state.manuallyExpandedNodes = [];
    });
    builder.addCase(enablePreferredRoots, (state: OntologiesState) => {
      state.preferredRoots = true;
    });
    builder.addCase(disablePreferredRoots, (state: OntologiesState) => {
      state.preferredRoots = false;
    });
    builder.addCase(showObsolete, (state: OntologiesState) => {
      state.showObsolete = true;
    });
    builder.addCase(hideObsolete, (state: OntologiesState) => {
      state.showObsolete = false;
    });
    builder.addCase(showSiblings, (state: OntologiesState) => {
      state.showSiblings = true;
    });
    builder.addCase(hideSiblings, (state: OntologiesState) => {
      state.showSiblings = false;
    });
    builder.addCase(showCounts, (state: OntologiesState) => {
      state.showCounts = true;
    });
    builder.addCase(hideCounts, (state: OntologiesState) => {
      state.showCounts = false;
    });
    builder.addCase(
      openNode,
      (state: OntologiesState, action: PayloadAction<TreeNode>) => {
        state.manuallyExpandedNodes = Array.from(
          new Set([...state.manuallyExpandedNodes, action.payload.absoluteIdentity])
        );
      }
    );
    builder.addCase(
      closeNode,
      (state: OntologiesState, action: PayloadAction<TreeNode>) => {
        state.manuallyExpandedNodes = state.manuallyExpandedNodes.filter(
          (node) => node !== action.payload.absoluteIdentity
        );
        state.automaticallyExpandedNodes = state.automaticallyExpandedNodes.filter(
          (node) => node !== action.payload.absoluteIdentity
        );
	delete state.nodeChildren[action.payload.absoluteIdentity];
	state.nodesWithChildrenLoaded = state.nodesWithChildrenLoaded.filter(absId => absId !== action.payload.absoluteIdentity)
      }
    );
  },
});

export default ontologiesSlice.reducer;
