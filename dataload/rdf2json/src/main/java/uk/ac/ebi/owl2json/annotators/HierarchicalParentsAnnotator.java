package uk.ac.ebi.rdf2json.annotators;

import uk.ac.ebi.rdf2json.OntologyGraph;
import uk.ac.ebi.rdf2json.OntologyNode;
import uk.ac.ebi.rdf2json.annotators.helpers.PropertyCollator;
import uk.ac.ebi.rdf2json.properties.*;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

public class HierarchicalParentsAnnotator {

    public static Set<String> getHierarchicalProperties(OntologyGraph graph) {

        Set<String> hierarchicalProperties = new TreeSet<>(
                List.of(
                        "http://www.w3.org/2000/01/rdf-schema#subClassOf"
                )
        );

        Object configHierarchicalProperties = graph.config.get("hierarchical_property");

        if(configHierarchicalProperties instanceof Collection<?>) {
            hierarchicalProperties.addAll((Collection<String>) configHierarchicalProperties);
        } else {
            hierarchicalProperties.add("http://purl.obolibrary.org/obo/BFO_0000050");
        }

        return hierarchicalProperties;
    }

    public static void annotateHierarchicalParents(OntologyGraph graph) {

	Set<String> hierarchicalProperties = getHierarchicalProperties(graph);

        long startTime3 = System.nanoTime();
        for(String id : graph.nodes.keySet()) {
            OntologyNode c = graph.nodes.get(id);
            if (c.types.contains(OntologyNode.NodeType.CLASS) ||
                    c.types.contains(OntologyNode.NodeType.PROPERTY) ||
                    c.types.contains(OntologyNode.NodeType.NAMED_INDIVIDUAL)) {

                // skip bnodes
                if(c.uri == null)
                    continue;

                List<PropertyValue> parents = c.properties.getPropertyValues("http://www.w3.org/2000/01/rdf-schema#subClassOf");

                if(parents != null) {
                    for(PropertyValue parent : parents) {

                        if (parent.getType() == PropertyValue.Type.URI && graph.nodes.containsKey(((PropertyValueURI) parent).getUri())) {

                            // Direct parent; these are also considered hierarchical parents
                            c.properties.addProperty("hierarchicalParent", parent);

                        }
                    }
                }

                // any non direct parents have already been interpreted by RelatedAnnotator, so we
                // can find their values in relatedTo
                //
                List<PropertyValue> relatedTo = (List<PropertyValue>) c.properties.getPropertyValues("relatedTo");

                if(relatedTo != null) {
                    for(PropertyValue related : relatedTo) {

                        if(related.getType() == PropertyValue.Type.RELATED) {

                            if(hierarchicalProperties.contains(  ((PropertyValueRelated) related).getProperty()  )) {

                                c.properties.addProperty("hierarchicalParent",
                                    new PropertyValueURI(
                                        ((PropertyValueRelated) related).getFiller().uri
                                    )
                                );

                            }
                        }
                    }
                }
            }
        }
        long endTime3 = System.nanoTime();
        System.out.println("annotate hierarchical parents: " + ((endTime3 - startTime3) / 1000 / 1000 / 1000));
    }


}
