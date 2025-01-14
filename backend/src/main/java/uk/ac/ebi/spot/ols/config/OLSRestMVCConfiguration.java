package uk.ac.ebi.spot.ols.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.rest.core.config.RepositoryRestConfiguration;
import org.springframework.data.rest.webmvc.config.RepositoryRestConfigurer;
import uk.ac.ebi.spot.ols.model.v1.V1OntologyConfig;

/**
 * @author Simon Jupp
 * @date 10/07/2015
 * Samples, Phenotypes and Ontologies Team, EMBL-EBI
 */
@Configuration
public class OLSRestMVCConfiguration implements RepositoryRestConfigurer {

    public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config) {
        config.getMetadataConfiguration().setAlpsEnabled(false);
        config.setBasePath("/api");
        config.exposeIdsFor(V1OntologyConfig.class, V1OntologyConfig.class);

    }

}