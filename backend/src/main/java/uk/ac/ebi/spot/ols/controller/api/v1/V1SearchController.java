package uk.ac.ebi.spot.ols.controller.api.v1;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.client.solrj.util.ClientUtils;
import org.apache.solr.common.SolrDocument;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.rest.webmvc.RepositoryLinksResource;
import org.springframework.hateoas.server.mvc.WebMvcLinkBuilder;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import uk.ac.ebi.spot.ols.repository.Validation;
import uk.ac.ebi.spot.ols.repository.solr.OlsSolrClient;
import uk.ac.ebi.spot.ols.repository.transforms.LocalizationTransform;
import uk.ac.ebi.spot.ols.repository.transforms.RemoveLiteralDatatypesTransform;
import uk.ac.ebi.spot.ols.repository.v1.JsonHelper;
import uk.ac.ebi.spot.ols.repository.v1.V1OntologyRepository;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

/**
 * @author Simon Jupp
 * @date 02/07/2015
 * Samples, Phenotypes and Ontologies Team, EMBL-EBI
 */
@Controller
public class V1SearchController {

    Gson gson = new Gson();

    @Autowired
    private V1OntologyRepository ontologyRepository;

    @Autowired
    private OlsSolrClient solrClient;


    @RequestMapping(path = "/api/search", produces = {MediaType.APPLICATION_JSON_VALUE}, method = RequestMethod.GET)
    public void search(
            @RequestParam("q") String query,
            @RequestParam(value = "ontology", required = false) Collection<String> ontologies,
            @RequestParam(value = "type", required = false) Collection<String> types,
            @RequestParam(value = "slim", required = false) Collection<String> slims,
            @RequestParam(value = "fieldList", required = false) Collection<String> fieldList,
            @RequestParam(value = "queryFields", required = false) Collection<String> queryFields,
            @RequestParam(value = "exact", required = false) boolean exact,
            @RequestParam(value = "groupField", required = false) String groupField,
            @RequestParam(value = "obsoletes", defaultValue = "false") boolean queryObsoletes,
            @RequestParam(value = "local", defaultValue = "false") boolean isLocal,
            @RequestParam(value = "childrenOf", required = false) Collection<String> childrenOf,
            @RequestParam(value = "allChildrenOf", required = false) Collection<String> allChildrenOf,
            @RequestParam(value = "inclusive", required = false) boolean inclusive,
            @RequestParam(value = "isLeaf", required = false) boolean isLeaf,
            @RequestParam(value = "rows", defaultValue = "10") Integer rows,
            @RequestParam(value = "start", defaultValue = "0") Integer start,
            @RequestParam(value = "format", defaultValue = "json") String format,
            @RequestParam(value = "lang", defaultValue = "en") String lang,
            HttpServletResponse response
    ) throws IOException, SolrServerException {

        final SolrQuery solrQuery = new SolrQuery(); // 1

        if (queryFields == null) {
            // if exact just search the supplied fields for exact matches
            if (exact) {
                String[] fields = {"label_s", "synonym_s", "short_form_s", "obo_id_s", "iri_s", "annotations_trimmed"};
                solrQuery.setQuery(
                        "((" +
                                createUnionQuery(query.toLowerCase(), mapFieldsList(fields), true)
                                + ") AND (imported:\"false\"^100 OR imported:true^0))"
                );

            } else {

                solrQuery.set("defType", "edismax");
                solrQuery.setQuery(query);

                String[] fields = {"label^5", "synonym^3", "definition", "shortForm^2", "curie^2", /*"annotations", "logical_description",*/ "iri"};

                solrQuery.set("qf", String.join(" ", mapFieldsList(fields)));

                solrQuery.set("bq",
                        "isDefiningOntology:\"true\"^100 " +
                        "lowercase_label:\"" + query.toLowerCase() + "\"^5" +
                        "lowercase_synonym:\"" + query.toLowerCase() + "\"^3");
            }
        } else {
            if (exact) {
                String[] fields = mapFieldsList(queryFields.toArray(new String[0]));
                solrQuery.setQuery(createUnionQuery(query, fields, true));
            } else {

                solrQuery.set("defType", "edismax");
                solrQuery.setQuery(query);
                solrQuery.set("qf", String.join(" ", mapFieldsList(queryFields.toArray(new String[0]))));
            }
        }

        solrQuery.setFields("_json");

        if (ontologies != null && !ontologies.isEmpty()) {

            for(String ontologyId : ontologies)
                Validation.validateOntologyId(ontologyId);

            solrQuery.addFilterQuery("ontologyId: (" + String.join(" OR ", ontologies) + ")");
        }

        if (slims != null) {
            solrQuery.addFilterQuery("subset: (" + String.join(" OR ", slims) + ")");
        }

        if (isLocal) {
            solrQuery.addFilterQuery("imported:false");
        }

        if (isLeaf) {
            solrQuery.addFilterQuery("hasChildren:false");
        }

        if (types != null) {
            solrQuery.addFilterQuery("type: (" + String.join(" OR ", types) + ")");
        }

        if (groupField != null) {
            solrQuery.addFilterQuery("{!collapse field=iri}");
            solrQuery.add("expand=true", "true");
            solrQuery.add("expand.rows", "100");

        }

        if (childrenOf != null) {
            String result = childrenOf.stream()
                    .map(addQuotes)
                    .collect(Collectors.joining(" OR "));

            if (inclusive) {
                solrQuery.addFilterQuery("filter( iri: (" + result + ")) filter(hasHierarchicalAncestor: (" + result + "))");
            } else {
                solrQuery.addFilterQuery("hasHierarchicalAncestor: (" + result + ")");
            }

        }

        if (allChildrenOf != null) {
            String result = allChildrenOf.stream()
                    .map(addQuotes)
                    .collect(Collectors.joining(" OR "));

            if (inclusive) {
                solrQuery.addFilterQuery("filter( iri: (" + result + ")) filter(hasHierarchicalAncestor: (" + result + "))");
            } else {
                solrQuery.addFilterQuery("hasHierarchicalAncestor: (" + result + ")");
            }
        }

        solrQuery.addFilterQuery("isObsolete:" + queryObsoletes);

        solrQuery.setStart(start);
        solrQuery.setRows(rows);
//        solrQuery.setHighlight(true);
//        solrQuery.add("hl.simple.pre", "<b>");
//        solrQuery.add("hl.simple.post", "</b>");
//        solrQuery.addHighlightField("http://www.w3.org/2000/01/rdf-schema#label");
//        solrQuery.addHighlightField("https://github.com/EBISPOT/owl2neo#synonym");
//        solrQuery.addHighlightField("https://github.com/EBISPOT/owl2neo#definition");

//        solrQuery.addFacetField("ontology_name", "ontology_prefix", "type", "subset", "is_defining_ontology", "is_obsolete");
        solrQuery.add("wt", format);


        System.out.println(solrQuery.jsonStr());

        QueryResponse qr = dispatchSearch(solrQuery, "ols4_entities");

        List<Object> docs = new ArrayList<>();
        for(SolrDocument res : qr.getResults()) {

            String _json = (String)res.get("_json");
            if(_json == null) {
                throw new RuntimeException("_json was null");
            }

            JsonObject json = RemoveLiteralDatatypesTransform.transform(
                    LocalizationTransform.transform( JsonParser.parseString( _json ), lang)
            ).getAsJsonObject();

            Map<String,Object> outDoc = new HashMap<>();

            outDoc.put("id", JsonHelper.getString(json, "id"));
            outDoc.put("iri", JsonHelper.getString(json, "iri"));
            outDoc.put("ontology_name", JsonHelper.getString(json, "ontologyId"));
            outDoc.put("label", JsonHelper.getStrings(json, "label"));
            outDoc.put("description", JsonHelper.getStrings(json, "definition"));
            outDoc.put("short_form", JsonHelper.getStrings(json, "shortForm"));
            outDoc.put("obo_id", JsonHelper.getStrings(json, "curie"));
            outDoc.put("is_defining_ontology", JsonHelper.getString(json, "isDefiningOntology").equals("true"));
            outDoc.put("type", "class");

            // TODO: ontology_prefix

            docs.add(outDoc);
        }


        Map<String, Object> responseHeader = new HashMap<>();
        responseHeader.put("status", 0);
        responseHeader.put("QTime", qr.getQTime());

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("numFound", qr.getResults().getNumFound());
        responseBody.put("start", 0);
        responseBody.put("docs", docs);

        Map<String, Object> responseObj = new HashMap<>();
        responseObj.put("responseHeader", responseHeader);
        responseObj.put("docs", docs);

        response.getOutputStream().write(gson.toJson(responseObj).getBytes(StandardCharsets.UTF_8));
        response.flushBuffer();
    }

    Function<String, String> addQuotes = new Function<String, String>() {
        @Override
        public String apply(String s) {
            return new StringBuilder(s.length() + 2).append('"').append(s).append('"').toString();
        }
    };

    private String createUnionQuery(String query, String[] fields, boolean exact) {
        StringBuilder builder = new StringBuilder();
        for (int x = 0; x < fields.length; x++) {
            builder.append(fields[x]);
            builder.append(":\"");

            if(!exact)
                builder.append("*");

            builder.append(query);

            if(!exact)
                builder.append("*");

            builder.append("\" ");

            if (x + 1 < fields.length) {
                builder.append("OR ");
            }
        }
        return builder.toString();
    }


    private QueryResponse dispatchSearch(SolrQuery query, String core) throws IOException, SolrServerException {
        org.apache.solr.client.solrj.SolrClient mySolrClient = new HttpSolrClient.Builder(solrClient.host + "/solr/" + core).build();
        return mySolrClient.query(query);
    }

    // Maps OLS3 field names to the OLS4 schema
    //
    private String[] mapFieldsList(String[] ols3FieldNames) {

        List<String> newFields = new ArrayList<>();

        for (String legacyFieldName : ols3FieldNames) {

            String prefix = "";
            String suffix = "";

            // OLS3 uses a SUFFIX of "_s" for string versions of fields.
            // In OLS4 we use "lowercase_" as a PREFIX instead.
            //
            if (legacyFieldName.endsWith("_s")) {
                prefix = "str_";
                legacyFieldName = legacyFieldName.substring(0, legacyFieldName.length() - 2);
            } else if (legacyFieldName.endsWith("_e")) {
                prefix = "edge_";
                legacyFieldName = legacyFieldName.substring(0, legacyFieldName.length() - 2);
            }

            if (legacyFieldName.indexOf('^') != -1) {
                suffix = legacyFieldName.substring(legacyFieldName.indexOf('^') + 1);
                legacyFieldName = legacyFieldName.substring(0, legacyFieldName.indexOf('^') - 1);
            }

            if (legacyFieldName.equals("iri")) {
                newFields.add(prefix + "iri" + suffix);
                continue;
            }

            if (legacyFieldName.equals("label")) {
                newFields.add(prefix + "label" + suffix);
                continue;
            }

            if (legacyFieldName.equals("synonym")) {
                newFields.add(prefix + "synonym" + suffix);
                continue;
            }

            if (legacyFieldName.equals("definition")) {
                newFields.add(prefix + "definition" + suffix);
                continue;
            }

            if (legacyFieldName.equals("description")) {
                newFields.add(prefix + "definition" + suffix);
                continue;
            }

            if (legacyFieldName.equals("short_form")) {
                newFields.add(prefix + "shortForm" + suffix);
                continue;
            }

        }

        // escape special characters in field names for solr query
        //
        newFields = newFields.stream().map(iri -> {
            return iri.replace(":", "__");
        }).collect(Collectors.toList());

        return newFields.toArray(new String[0]);
    }


}
